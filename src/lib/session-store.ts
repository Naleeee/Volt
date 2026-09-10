import { create } from "zustand";
import { syncRestEndNotification } from "@/lib/notifications";
import { playTimerSound } from "@/lib/sounds";

type SessionState = {
  sessionId: number | null;
  exerciseIndex: number;
  setNumber: number;
  holdStartedAt: number | null;
  holdElapsedMs: number;
  restEndsAt: number | null;
  restDurationSec: number;
  begin: (sessionId: number) => void;
  restore: (
    sessionId: number,
    exerciseIndex: number,
    setNumber: number,
  ) => void;
  setPosition: (exerciseIndex: number, setNumber: number) => void;
  startHold: () => void;
  pauseHold: () => void;
  resetHold: () => void;
  startRest: (durationSec: number) => void;
  extendRest: (seconds: number) => void;
  clearRest: () => void;
  end: () => void;
};

const noHold = { holdStartedAt: null, holdElapsedMs: 0 };

const idle = {
  sessionId: null,
  exerciseIndex: 0,
  setNumber: 1,
  ...noHold,
  restEndsAt: null,
  restDurationSec: 0,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...idle,
  begin: (sessionId) => set({ ...idle, sessionId }),
  restore: (sessionId, exerciseIndex, setNumber) =>
    set({ ...idle, sessionId, exerciseIndex, setNumber }),
  setPosition: (exerciseIndex, setNumber) =>
    set({ exerciseIndex, setNumber, ...noHold }),
  startHold: () => set({ holdStartedAt: Date.now() }),
  pauseHold: () =>
    set((s) => ({
      holdStartedAt: null,
      holdElapsedMs:
        s.holdElapsedMs + (s.holdStartedAt ? Date.now() - s.holdStartedAt : 0),
    })),
  resetHold: () => set(noHold),
  startRest: (durationSec) =>
    set({
      restEndsAt: Date.now() + durationSec * 1000,
      restDurationSec: durationSec,
    }),
  extendRest: (seconds) =>
    set((s) =>
      s.restEndsAt === null
        ? {}
        : { restEndsAt: s.restEndsAt + seconds * 1000, restDurationSec: s.restDurationSec + seconds },
    ),
  clearRest: () => set({ restEndsAt: null }),
  end: () => set(idle),
}));

let restTimer: ReturnType<typeof setTimeout> | undefined;

// Rest can end on any session screen, so the cue follows the store rather than a component.
useSessionStore.subscribe((state, prev) => {
  if (state.restEndsAt === prev.restEndsAt) return;
  clearTimeout(restTimer);
  syncRestEndNotification(state.restEndsAt);
  if (state.restEndsAt !== null)
    restTimer = setTimeout(
      () => void playTimerSound("rest"),
      Math.max(0, state.restEndsAt - Date.now()),
    );
});
