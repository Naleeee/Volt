import { create } from "zustand";

// Ephemeral pointers only. Everything durable (sets, start/end) lives in SQLite;
// timers are timestamps so display time is derived from the clock and survives backgrounding.
type SessionState = {
  sessionId: number | null;
  exerciseIndex: number;
  setNumber: number;
  setStartedAt: number | null;
  restEndsAt: number | null;
  begin: (sessionId: number) => void;
  restore: (sessionId: number, exerciseIndex: number, setNumber: number) => void;
  setPosition: (exerciseIndex: number, setNumber: number) => void;
  startSet: () => void;
  startRest: (durationSec: number) => void;
  clearRest: () => void;
  end: () => void;
};

const idle = {
  sessionId: null,
  exerciseIndex: 0,
  setNumber: 1,
  setStartedAt: null,
  restEndsAt: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...idle,
  begin: (sessionId) => set({ ...idle, sessionId }),
  restore: (sessionId, exerciseIndex, setNumber) =>
    set({ ...idle, sessionId, exerciseIndex, setNumber }),
  setPosition: (exerciseIndex, setNumber) =>
    set({ exerciseIndex, setNumber, setStartedAt: null, restEndsAt: null }),
  startSet: () => set({ setStartedAt: Date.now() }),
  startRest: (durationSec) => set({ restEndsAt: Date.now() + durationSec * 1000 }),
  clearRest: () => set({ restEndsAt: null }),
  end: () => set(idle),
}));
