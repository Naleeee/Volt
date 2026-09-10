import { syncRestEndNotification } from "@/lib/notifications";
import { useSessionStore } from "@/lib/session-store";
import { playTimerSound } from "@/lib/sounds";

jest.mock("@/lib/notifications", () => ({ syncRestEndNotification: jest.fn() }));
jest.mock("@/lib/sounds", () => ({ playTimerSound: jest.fn(() => Promise.resolve()) }));

const NOW = 1_700_000_000_000;
const store = () => useSessionStore.getState();

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  store().end();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe("position", () => {
  it("begin starts from the first set, restore resumes where the DB says", () => {
    store().begin(7);
    expect(store()).toMatchObject({ sessionId: 7, exerciseIndex: 0, setNumber: 1, restEndsAt: null });
    store().restore(8, 2, 3);
    expect(store()).toMatchObject({ sessionId: 8, exerciseIndex: 2, setNumber: 3 });
  });

  it("setPosition drops any running hold but keeps rest", () => {
    store().begin(1);
    store().startHold();
    store().startRest(45);
    store().setPosition(1, 2);
    expect(store()).toMatchObject({ exerciseIndex: 1, setNumber: 2, holdStartedAt: null, holdElapsedMs: 0, restEndsAt: NOW + 45_000 });
  });

  it("end returns to idle", () => {
    store().begin(1);
    store().startRest(45);
    store().end();
    expect(store()).toMatchObject({ sessionId: null, exerciseIndex: 0, setNumber: 1, restEndsAt: null, restDurationSec: 0 });
  });
});

describe("hold timer", () => {
  it("accumulates elapsed time across pause and resume", () => {
    store().startHold();
    expect(store().holdStartedAt).toBe(NOW);
    jest.advanceTimersByTime(1500);
    store().pauseHold();
    expect(store()).toMatchObject({ holdStartedAt: null, holdElapsedMs: 1500 });

    store().startHold();
    jest.advanceTimersByTime(500);
    store().pauseHold();
    expect(store().holdElapsedMs).toBe(2000);

    store().pauseHold();
    expect(store().holdElapsedMs).toBe(2000);

    store().resetHold();
    expect(store()).toMatchObject({ holdStartedAt: null, holdElapsedMs: 0 });
  });
});

describe("rest timer", () => {
  it("stores the end as a timestamp and extends it", () => {
    store().startRest(45);
    expect(store()).toMatchObject({ restEndsAt: NOW + 45_000, restDurationSec: 45 });
    store().extendRest(15);
    expect(store()).toMatchObject({ restEndsAt: NOW + 60_000, restDurationSec: 60 });
    store().clearRest();
    expect(store().restEndsAt).toBeNull();
  });

  it("ignores extend when no rest is running", () => {
    store().extendRest(15);
    expect(store()).toMatchObject({ restEndsAt: null, restDurationSec: 0 });
  });

  it("syncs the notification and plays the sound when rest ends", () => {
    store().startRest(45);
    expect(syncRestEndNotification).toHaveBeenCalledWith(NOW + 45_000);

    jest.advanceTimersByTime(44_999);
    expect(playTimerSound).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(playTimerSound).toHaveBeenCalledWith("rest");
  });

  it("cancels the pending sound when rest is skipped", () => {
    store().startRest(45);
    store().clearRest();
    expect(syncRestEndNotification).toHaveBeenLastCalledWith(null);
    jest.advanceTimersByTime(60_000);
    expect(playTimerSound).not.toHaveBeenCalled();
  });

  it("reschedules the sound when rest is extended", () => {
    store().startRest(45);
    store().extendRest(15);
    jest.advanceTimersByTime(45_000);
    expect(playTimerSound).not.toHaveBeenCalled();
    jest.advanceTimersByTime(15_000);
    expect(playTimerSound).toHaveBeenCalledTimes(1);
  });
});
