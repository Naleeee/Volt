import { sql } from "drizzle-orm";
import {
  defaultEntry,
  insertRoutine,
  routineFormSchema,
  updateRoutine,
  useRoutine,
  useRoutines,
  type RoutineEntry,
} from "@/db/queries/routines";
import { useLiveTables } from "@/db/live";
import { exercises, routineExercises, routines, sessions } from "@/db/schema";

jest.mock("@/db/client");
jest.mock("drizzle-orm/expo-sqlite");
jest.mock("@/db/live", () => ({ useLiveTables: jest.fn((run: () => unknown) => run()) }));

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");
const { live } =
  jest.requireMock<typeof import("@/__mocks__/drizzle-orm/expo-sqlite")>("drizzle-orm/expo-sqlite");

beforeEach(resetDb);
afterEach(() => {
  live.loading = false;
});

function seedExercises() {
  return db
    .insert(exercises)
    .values([
      { name: "Bench Press", measuredBy: "reps" },
      { name: "Plank", measuredBy: "time" },
    ])
    .returning()
    .all();
}

describe("defaultEntry", () => {
  it("picks the target that matches the exercise type", () => {
    const base = { id: 1, name: "X", mediaPath: null, mediaType: null };
    expect(defaultEntry({ ...base, measuredBy: "reps" })).toMatchObject({
      targetSets: 3,
      targetReps: 10,
      targetTimeSec: null,
    });
    expect(defaultEntry({ ...base, measuredBy: "time" })).toMatchObject({
      targetReps: null,
      targetTimeSec: 30,
    });
    expect(defaultEntry({ ...base, measuredBy: "other" })).toMatchObject({
      targetReps: null,
      targetTimeSec: null,
      targetWeightKg: null,
    });
  });
});

describe("routineFormSchema", () => {
  it("needs a name and at least one entry", () => {
    expect(() => routineFormSchema.parse({ name: " ", entries: [] })).toThrow(/required/);
    expect(() => routineFormSchema.parse({ name: "Push", entries: [] })).toThrow(
      /at least one/,
    );
  });
});

describe("insertRoutine / updateRoutine", () => {
  it("writes entries with 1-based positions in the given order", () => {
    const [bench, plank] = seedExercises();
    const entries: RoutineEntry[] = [
      { ...defaultEntry(plank), targetSets: 2 },
      { ...defaultEntry(bench), targetWeightKg: 60 },
    ];
    const { id } = insertRoutine({ name: "Push Day", entries });

    const rows = db
      .select()
      .from(routineExercises)
      .where(sql`routine_id = ${id}`)
      .all();
    expect(rows.map((r) => [r.position, r.exerciseId, r.targetSets])).toEqual([
      [1, plank.id, 2],
      [2, bench.id, 3],
    ]);
    expect(rows[1].targetWeightKg).toBe(60);
  });

  it("replaces the entries wholesale on update", () => {
    const [bench, plank] = seedExercises();
    const { id } = insertRoutine({
      name: "Push Day",
      entries: [defaultEntry(bench), defaultEntry(plank)],
    });

    updateRoutine(id, {
      name: "Pull Day",
      entries: [{ ...defaultEntry(bench), targetSets: 5 }],
    });

    const detail = useRoutine(id);
    expect(detail?.name).toBe("Pull Day");
    expect(detail?.entries).toEqual([
      expect.objectContaining({ exerciseId: bench.id, name: "Bench Press", targetSets: 5 }),
    ]);
  });

  it("rolls the routine back when an entry references a missing exercise", () => {
    const [bench] = seedExercises();
    expect(() =>
      insertRoutine({
        name: "Broken",
        entries: [{ ...defaultEntry(bench), exerciseId: 999 }],
      }),
    ).toThrow(/FOREIGN KEY/);
    expect(db.select().from(routines).all()).toHaveLength(0);
  });
});

describe("useRoutines", () => {
  it("lists active routines by creation date with counts and last performed", () => {
    const [bench, plank] = seedExercises();
    const push = insertRoutine({ name: "Push", entries: [defaultEntry(bench), defaultEntry(plank)] });
    db.update(routines).set({ createdAt: 10 }).where(sql`id = ${push.id}`).run();
    const legs = insertRoutine({ name: "Legs", entries: [defaultEntry(plank)] });
    db.update(routines).set({ createdAt: 5 }).where(sql`id = ${legs.id}`).run();
    const old = insertRoutine({ name: "Old", entries: [defaultEntry(bench)] });
    db.update(routines).set({ archivedAt: 1 }).where(sql`id = ${old.id}`).run();

    db.insert(sessions)
      .values([
        { routineId: push.id, startedAt: 100, endedAt: 200 },
        { routineId: push.id, startedAt: 300, endedAt: 400 },
        { routineId: push.id, startedAt: 500, endedAt: null },
      ])
      .run();

    expect(useRoutines()).toEqual([
      { id: legs.id, name: "Legs", exerciseCount: 1, lastPerformedAt: null },
      { id: push.id, name: "Push", exerciseCount: 2, lastPerformedAt: 400 },
    ]);
  });
});

describe("useRoutine", () => {
  it("returns entries in position order and undefined for an unknown id", () => {
    const [bench, plank] = seedExercises();
    const { id } = insertRoutine({
      name: "Push",
      entries: [defaultEntry(plank), defaultEntry(bench)],
    });
    expect(useRoutine(id)?.entries.map((e) => e.name)).toEqual(["Plank", "Bench Press"]);
    expect(useRoutine(id)?.lastPerformedAt).toBeNull();
    expect(useRoutine(999)).toBeUndefined();
  });

  it("is undefined while loading, and the list is empty", () => {
    const [bench] = seedExercises();
    const { id } = insertRoutine({ name: "Push", entries: [defaultEntry(bench)] });
    jest.mocked(useLiveTables).mockReturnValueOnce(undefined);
    expect(useRoutines()).toEqual([]);
    live.loading = true;
    expect(useRoutine(id)).toBeUndefined();
  });
});
