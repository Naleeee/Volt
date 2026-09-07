import {
  deleteSet,
  discardSession,
  finishSession,
  getResumePosition,
  logSet,
  startSession,
  useActiveSession,
  useGhostSets,
  useLastPerformedSet,
  useSession,
  useSessionSets,
  useWeekStats,
} from "@/db/queries/sessions";
import {
  exercises,
  routineExercises,
  routines,
  sessions,
  sessionSets,
} from "@/db/schema";

jest.mock("@/db/client");
jest.mock("drizzle-orm/expo-sqlite");

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");
const { live } =
  jest.requireMock<typeof import("@/__mocks__/drizzle-orm/expo-sqlite")>("drizzle-orm/expo-sqlite");

// Wednesday 2026-09-09 12:00 local; the week starts Monday 09-07.
const NOW = new Date(2026, 8, 9, 12).getTime();
const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  resetDb();
  jest.useFakeTimers({ now: NOW });
});
afterEach(() => {
  jest.useRealTimers();
  live.loading = false;
});

function seedRoutine() {
  const [bench, plank] = db
    .insert(exercises)
    .values([
      { name: "Bench Press", measuredBy: "reps" },
      { name: "Plank", measuredBy: "time", restOverrideSec: 120 },
    ])
    .returning({ id: exercises.id })
    .all();
  const routine = db
    .insert(routines)
    .values({ name: "Push Day", createdAt: 1 })
    .returning({ id: routines.id })
    .get();
  db.insert(routineExercises)
    .values([
      { routineId: routine.id, exerciseId: bench.id, position: 1, targetSets: 2, targetReps: 8, targetWeightKg: 60 },
      { routineId: routine.id, exerciseId: plank.id, position: 2, targetSets: 1, targetTimeSec: 45 },
    ])
    .run();
  return { bench: bench.id, plank: plank.id, routine: routine.id };
}

function addSession(routineId: number, startedAt: number, endedAt: number | null) {
  return db
    .insert(sessions)
    .values({ routineId, startedAt, endedAt })
    .returning({ id: sessions.id })
    .get().id;
}

function addSet(
  sessionId: number,
  exerciseId: number,
  setNumber: number,
  completedAt: number,
  extra: { reps?: number; skipped?: boolean } = {},
) {
  db.insert(sessionSets)
    .values({ sessionId, exerciseId, setNumber, completedAt, ...extra })
    .run();
}

describe("startSession", () => {
  it("opens a session and refuses a second one while it is open", () => {
    const { routine } = seedRoutine();
    const { id } = startSession(routine);
    expect(db.select().from(sessions).all()).toEqual([
      { id, routineId: routine, startedAt: NOW, endedAt: null },
    ]);
    expect(() => startSession(routine)).toThrow(/already in progress/);

    finishSession(id);
    expect(() => startSession(routine)).not.toThrow();
  });
});

describe("set writes", () => {
  it("logs, lists in completion order and deletes sets", () => {
    const { routine, bench } = seedRoutine();
    const { id } = startSession(routine);
    const first = logSet({ sessionId: id, exerciseId: bench, setNumber: 1, reps: 8, weightKg: 60 });
    jest.setSystemTime(NOW + 1000);
    logSet({ sessionId: id, exerciseId: bench, setNumber: 2, skipped: true });

    expect(useSessionSets(id)).toEqual([
      expect.objectContaining({ id: first.id, setNumber: 1, reps: 8, weightKg: 60, skipped: false, completedAt: NOW }),
      expect.objectContaining({ setNumber: 2, skipped: true, completedAt: NOW + 1000 }),
    ]);

    deleteSet(first.id);
    expect(useSessionSets(id).map((s) => s.setNumber)).toEqual([2]);
  });

  it("finishes with a timestamp and discards with its sets", () => {
    const { routine, bench } = seedRoutine();
    const { id } = startSession(routine);
    logSet({ sessionId: id, exerciseId: bench, setNumber: 1 });

    jest.setSystemTime(NOW + 5000);
    finishSession(id);
    expect(db.select().from(sessions).get()?.endedAt).toBe(NOW + 5000);

    discardSession(id);
    expect(db.select().from(sessions).all()).toHaveLength(0);
    expect(db.select().from(sessionSets).all()).toHaveLength(0);
  });
});

describe("getResumePosition", () => {
  it("points at the first entry with sets left", () => {
    const { routine, bench, plank } = seedRoutine();
    const { id } = startSession(routine);
    expect(getResumePosition(id, routine)).toEqual({ exerciseIndex: 0, setNumber: 1 });

    logSet({ sessionId: id, exerciseId: bench, setNumber: 1 });
    expect(getResumePosition(id, routine)).toEqual({ exerciseIndex: 0, setNumber: 2 });

    logSet({ sessionId: id, exerciseId: bench, setNumber: 2 });
    expect(getResumePosition(id, routine)).toEqual({ exerciseIndex: 1, setNumber: 1 });

    logSet({ sessionId: id, exerciseId: plank, setNumber: 1 });
    expect(getResumePosition(id, routine)).toBeNull();
  });

  it("resumes at the lowest open set when sets were logged out of order", () => {
    const { routine, bench } = seedRoutine();
    const { id } = startSession(routine);
    logSet({ sessionId: id, exerciseId: bench, setNumber: 2 });
    expect(getResumePosition(id, routine)).toEqual({ exerciseIndex: 0, setNumber: 1 });
  });
});

describe("useActiveSession", () => {
  it("is null without an open session and ignores finished ones", () => {
    const { routine } = seedRoutine();
    addSession(routine, NOW - DAY, NOW - DAY + 1000);
    expect(useActiveSession()).toBeNull();
  });

  it("reports planned and logged sets for the open session", () => {
    const { routine, bench } = seedRoutine();
    const { id } = startSession(routine);
    expect(useActiveSession()).toEqual({
      id,
      routineId: routine,
      routineName: "Push Day",
      startedAt: NOW,
      plannedSets: 3,
      loggedSets: 0,
      lastSetAt: null,
    });

    jest.setSystemTime(NOW + 2000);
    logSet({ sessionId: id, exerciseId: bench, setNumber: 1 });
    expect(useActiveSession()).toMatchObject({ loggedSets: 1, lastSetAt: NOW + 2000 });
  });
});

describe("useSession", () => {
  it("joins the routine entries in order and is undefined for an unknown id", () => {
    const { routine, bench, plank } = seedRoutine();
    const { id } = startSession(routine);
    const detail = useSession(id);
    expect(detail).toMatchObject({ id, routineId: routine, routineName: "Push Day", endedAt: null });
    expect(detail?.entries).toEqual([
      expect.objectContaining({ exerciseId: bench, name: "Bench Press", targetSets: 2, targetReps: 8, restOverrideSec: null }),
      expect.objectContaining({ exerciseId: plank, name: "Plank", targetSets: 1, targetTimeSec: 45, restOverrideSec: 120 }),
    ]);
    expect(useSession(999)).toBeUndefined();
  });
});

describe("previous performance", () => {
  it("useLastPerformedSet takes the latest non-skipped set from another session", () => {
    const { routine, bench } = seedRoutine();
    const a = addSession(routine, 100, 200);
    const b = addSession(routine, 300, null);
    const current = addSession(routine, 500, null);
    addSet(a, bench, 1, 150, { reps: 8 });
    addSet(b, bench, 1, 350, { reps: 12 });
    addSet(b, bench, 2, 360, { skipped: true });
    addSet(current, bench, 1, 550, { reps: 99 });

    expect(useLastPerformedSet(bench, current)).toMatchObject({ sessionId: b, reps: 12 });
    expect(useLastPerformedSet(999, current)).toBeUndefined();
  });

  it("useGhostSets returns each exercise's sets from its latest finished session", () => {
    const { routine, bench, plank } = seedRoutine();
    const a = addSession(routine, 100, 200);
    const b = addSession(routine, 300, 400);
    const unfinished = addSession(routine, 500, null);
    const current = addSession(routine, 600, null);
    addSet(a, bench, 1, 110, { reps: 8 });
    addSet(a, bench, 2, 120, { reps: 8 });
    addSet(a, plank, 1, 130);
    addSet(b, bench, 2, 320, { reps: 10 });
    addSet(b, bench, 1, 310, { reps: 11 });
    addSet(b, bench, 3, 330, { skipped: true });
    addSet(unfinished, bench, 1, 510, { reps: 50 });
    addSet(current, bench, 1, 610, { reps: 60 });

    const ghosts = useGhostSets([bench, plank], current);
    expect(ghosts.map((s) => [s.sessionId, s.exerciseId, s.setNumber])).toEqual([
      [b, bench, 1],
      [b, bench, 2],
      [a, plank, 1],
    ]);
    expect(useGhostSets([], current)).toEqual([]);
  });
});

describe("useWeekStats", () => {
  it("counts only finished sessions started this week and the running streak", () => {
    const { routine, bench } = seedRoutine();
    const weekStart = new Date(2026, 8, 7).getTime();
    const thisWeek = addSession(routine, weekStart + DAY, weekStart + DAY + 30 * 60 * 1000);
    const open = addSession(routine, weekStart + 2 * DAY, null);
    const lastWeek = addSession(routine, weekStart - 3 * DAY, weekStart - 3 * DAY + 20 * 60 * 1000);
    addSet(thisWeek, bench, 1, weekStart + DAY + 1);
    addSet(thisWeek, bench, 2, weekStart + DAY + 2, { skipped: true });
    addSet(open, bench, 1, weekStart + 2 * DAY + 1);
    addSet(lastWeek, bench, 1, weekStart - 3 * DAY + 1);

    expect(useWeekStats()).toEqual({
      workouts: 1,
      trainedSec: 1800,
      setsLogged: 1,
      streakWeeks: 2,
    });
  });

  it("is all zeros without history", () => {
    expect(useWeekStats()).toEqual({ workouts: 0, trainedSec: 0, setsLogged: 0, streakWeeks: 0 });
  });
});

describe("while the live queries are loading", () => {
  it("keeps session views undefined and stats at zero", () => {
    const { routine, bench } = seedRoutine();
    const { id } = startSession(routine);
    logSet({ sessionId: id, exerciseId: bench, setNumber: 1 });
    live.loading = true;

    expect(useActiveSession()).toBeUndefined();
    expect(useSession(id)).toBeUndefined();
    expect(useSessionSets(id)).toEqual([]);
    expect(useWeekStats()).toEqual({ workouts: 0, trainedSec: 0, setsLogged: 0, streakWeeks: 0 });
  });
});
