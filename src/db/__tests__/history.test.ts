import { getHistoryRows } from "@/db/queries/history";
import { exercises, routines, sessions, sessionSets } from "@/db/schema";

jest.mock("@/db/client");

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");

beforeEach(resetDb);

describe("getHistoryRows", () => {
  it("emits one row per set, sessions first by start then sets by completion", () => {
    const bench = db
      .insert(exercises)
      .values({ name: "Bench Press", measuredBy: "reps" })
      .returning({ id: exercises.id })
      .get();
    const routine = db
      .insert(routines)
      .values({ name: "Push Day", createdAt: 1 })
      .returning({ id: routines.id })
      .get();
    const [later, earlier] = db
      .insert(sessions)
      .values([
        { routineId: routine.id, startedAt: 500, endedAt: 900 },
        { routineId: routine.id, startedAt: 100, endedAt: null },
      ])
      .returning({ id: sessions.id })
      .all();
    db.insert(sessionSets)
      .values([
        { sessionId: later.id, exerciseId: bench.id, setNumber: 2, reps: 6, weightKg: 70, completedAt: 700 },
        { sessionId: later.id, exerciseId: bench.id, setNumber: 1, reps: 8, weightKg: 60, completedAt: 600, skipped: true },
      ])
      .run();

    expect(getHistoryRows()).toEqual([
      {
        sessionId: earlier.id,
        routine: "Push Day",
        startedAt: 100,
        endedAt: null,
        exercise: null,
        measuredBy: null,
        setNumber: null,
        reps: null,
        timeSec: null,
        weightKg: null,
        note: null,
        skipped: null,
        completedAt: null,
      },
      expect.objectContaining({ sessionId: later.id, exercise: "Bench Press", measuredBy: "reps", setNumber: 1, reps: 8, weightKg: 60, skipped: true, completedAt: 600 }),
      expect.objectContaining({ sessionId: later.id, setNumber: 2, reps: 6, weightKg: 70, skipped: false, completedAt: 700 }),
    ]);
  });

  it("is empty without sessions", () => {
    expect(getHistoryRows()).toEqual([]);
  });
});
