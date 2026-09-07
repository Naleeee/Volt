import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
  finishSession,
  logSet,
  startSession,
  type SessionEntry,
} from "@/db/queries/sessions";
import type { Settings } from "@/db/queries/settings";
import {
  finishWorkout,
  logSetAndAdvance,
  restRemainingSec,
  startWorkout,
} from "@/lib/session-flow";
import { useSessionStore } from "@/lib/session-store";
import { useToastStore } from "@/lib/toast";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), dismissTo: jest.fn() } }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("@/db/queries/sessions", () => ({
  startSession: jest.fn(),
  logSet: jest.fn(),
  finishSession: jest.fn(),
}));
jest.mock("@/lib/notifications", () => ({ syncRestEndNotification: jest.fn() }));
jest.mock("@/lib/sounds", () => ({ playTimerSound: jest.fn() }));

const settings: Settings = {
  restBetweenSetsSec: 45,
  restBetweenExercisesSec: 90,
  autostartRestTimer: true,
  timerSounds: true,
  keepAwake: true,
};

const entry = (over: Partial<SessionEntry>): SessionEntry => ({
  exerciseId: 1,
  name: "Bench Press",
  measuredBy: "reps",
  mediaPath: null,
  mediaType: null,
  restOverrideSec: null,
  targetSets: 2,
  targetReps: 8,
  targetTimeSec: null,
  targetWeightKg: null,
  ...over,
});

const session = {
  id: 5,
  entries: [entry({ exerciseId: 1 }), entry({ exerciseId: 2, targetSets: 1, restOverrideSec: 120 })],
};

const store = () => useSessionStore.getState();
const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

beforeEach(() => {
  jest.useFakeTimers({ now: 1_700_000_000_000 });
  store().end();
  useToastStore.getState().hide();
});
afterEach(() => jest.useRealTimers());

describe("startWorkout", () => {
  it("begins the store session and opens the checklist", () => {
    jest.mocked(startSession).mockReturnValue({ id: 9 });
    startWorkout(3);
    expect(startSession).toHaveBeenCalledWith(3);
    expect(store().sessionId).toBe(9);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/session/[id]", params: { id: "9" } });
  });

  it("toasts instead of navigating when a workout is already open", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(startSession).mockImplementation(() => {
      throw new Error("A workout is already in progress");
    });
    startWorkout(3);
    expect(store().sessionId).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    expect(useToastStore.getState().toast).toMatchObject({ kind: "error", message: expect.stringMatching(/current workout/) });
    error.mockRestore();
  });
});

describe("logSetAndAdvance", () => {
  it("writes the set, moves to the next set and rests between sets", () => {
    store().begin(5);
    const result = logSetAndAdvance(session, [[], []], 0, 1, settings, { reps: 8, weightKg: 60 });
    expect(logSet).toHaveBeenCalledWith({ sessionId: 5, exerciseId: 1, setNumber: 1, reps: 8, weightKg: 60 });
    expect(Haptics.impactAsync).toHaveBeenCalledWith("medium");
    expect(result).toEqual({ lastOfExercise: false, restStarted: true });
    expect(store()).toMatchObject({ exerciseIndex: 0, setNumber: 2, restDurationSec: 45 });
  });

  it("moves to the next exercise after its last set with the longer rest", () => {
    store().begin(5);
    const result = logSetAndAdvance(session, [[{ setNumber: 1 }], []], 0, 2, settings, { reps: 8 });
    expect(result).toEqual({ lastOfExercise: true, restStarted: true });
    expect(store()).toMatchObject({ exerciseIndex: 1, setNumber: 1, restDurationSec: 90 });
  });

  it("stays on the last entry and skips rest after the final set of the workout", () => {
    store().begin(5);
    const result = logSetAndAdvance(session, [[{ setNumber: 1 }, { setNumber: 2 }], []], 1, 1, settings, { timeSec: 45 });
    expect(result).toEqual({ lastOfExercise: true, restStarted: false });
    expect(store()).toMatchObject({ exerciseIndex: 1, setNumber: 1, restEndsAt: null });
  });

  it("skipped sets get no haptics and no rest", () => {
    store().begin(5);
    const result = logSetAndAdvance(session, [[], []], 0, 1, settings, { skipped: true });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(result.restStarted).toBe(false);
    expect(store().restEndsAt).toBeNull();
  });

  it("respects the auto-start setting and per-exercise override", () => {
    store().begin(5);
    expect(logSetAndAdvance(session, [[], []], 0, 1, { ...settings, autostartRestTimer: false }, { reps: 8 }).restStarted).toBe(false);

    const three = { id: 5, entries: [...session.entries, entry({ exerciseId: 3 })] };
    logSetAndAdvance(three, [[{ setNumber: 1 }, { setNumber: 2 }], [], []], 1, 1, settings, { timeSec: 45 });
    expect(store().restDurationSec).toBe(120);
  });

  it("moves to the nearest exercise with open sets, wrapping to earlier ones", () => {
    store().begin(5);
    const three = { id: 5, entries: [...session.entries, entry({ exerciseId: 3, targetSets: 1 })] };
    logSetAndAdvance(three, [[{ setNumber: 1 }], [{ setNumber: 1 }], []], 2, 1, settings, { reps: 8 });
    expect(store()).toMatchObject({ exerciseIndex: 0, setNumber: 2, restDurationSec: 90 });
  });
});

describe("finishWorkout", () => {
  const finish = () => {
    expect(finishSession).toHaveBeenCalledWith(5);
    expect(store().sessionId).toBeNull();
    expect(router.dismissTo).toHaveBeenCalledWith("/");
    expect(router.push).toHaveBeenCalledWith({ pathname: "/session/[id]/summary", params: { id: "5" } });
  };

  it("finishes straight away when every planned set is logged", () => {
    store().begin(5);
    finishWorkout(5, session.entries, 3);
    expect(alert).not.toHaveBeenCalled();
    finish();
  });

  it("asks first when sets are still open and finishes on confirm", () => {
    store().begin(5);
    finishWorkout(5, session.entries, 1);
    expect(finishSession).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Finish early?", "2 planned sets are still open.", expect.any(Array));

    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((b) => b.text === "Finish")?.onPress?.();
    finish();
  });

  it("uses the singular for one open set", () => {
    finishWorkout(5, session.entries, 2);
    expect(alert).toHaveBeenCalledWith(expect.any(String), "1 planned set is still open.", expect.any(Array));
  });
});

describe("restRemainingSec", () => {
  it("rounds up, caps at the duration and is 0 without rest", () => {
    expect(restRemainingSec(null, 45, 0)).toBe(0);
    expect(restRemainingSec(10_500, 45, 0)).toBe(11);
    expect(restRemainingSec(100_000, 45, 0)).toBe(45);
    expect(restRemainingSec(1_000, 45, 5_000)).toBe(-4);
  });
});
