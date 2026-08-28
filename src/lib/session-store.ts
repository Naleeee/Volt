import { create } from "zustand";

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
    set({ exerciseIndex, setNumber, ...noHold, restEndsAt: null }),
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
  clearRest: () => set({ restEndsAt: null }),
  end: () => set(idle),
}));
