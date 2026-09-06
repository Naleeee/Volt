import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getTableConfig, type SQLiteTable } from "drizzle-orm/sqlite-core";
import * as schema from "../schema";

const { exercises, routines, routineExercises, sessions, sessionSets, settings } =
  schema;

let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });
});

afterEach(() => sqlite.close());

function seedWorkout() {
  const exercise = db
    .insert(exercises)
    .values({ name: "Bench Press", measuredBy: "reps" })
    .returning()
    .get();
  const routine = db
    .insert(routines)
    .values({ name: "Push Day", createdAt: 1 })
    .returning()
    .get();
  db.insert(routineExercises)
    .values({ routineId: routine.id, exerciseId: exercise.id, position: 1 })
    .run();
  const session = db
    .insert(sessions)
    .values({ routineId: routine.id, startedAt: 1 })
    .returning()
    .get();
  return { exercise, routine, session };
}

describe("schema behavior", () => {
  it("defaults target_sets to 1", () => {
    seedWorkout();
    const [entry] = db.select().from(routineExercises).all();
    expect(entry.targetSets).toBe(1);
  });

  it("round-trips the skipped boolean and measured_by enum", () => {
    const { exercise, session } = seedWorkout();
    db.insert(sessionSets)
      .values({
        sessionId: session.id,
        exerciseId: exercise.id,
        setNumber: 1,
        skipped: true,
        completedAt: 2,
      })
      .run();

    const [row] = db.select().from(sessionSets).all();
    expect(row.skipped).toBe(true);
    expect(row.reps).toBeNull();
    const [ex] = db.select().from(exercises).all();
    expect(ex.measuredBy).toBe("reps");
  });

  it("cascades session deletion to its sets", () => {
    const { exercise, session } = seedWorkout();
    db.insert(sessionSets)
      .values({
        sessionId: session.id,
        exerciseId: exercise.id,
        setNumber: 1,
        completedAt: 2,
      })
      .run();

    db.delete(sessions).where(eq(sessions.id, session.id)).run();
    expect(db.select().from(sessionSets).all()).toHaveLength(0);
  });

  it("cascades routine deletion to its entries but not past sessions", () => {
    const { routine, session } = seedWorkout();

    // sessions reference routines without cascade: history blocks deletion
    expect(() =>
      db.delete(routines).where(eq(routines.id, routine.id)).run(),
    ).toThrow(/FOREIGN KEY/);

    db.delete(sessions).where(eq(sessions.id, session.id)).run();
    db.delete(routines).where(eq(routines.id, routine.id)).run();
    expect(db.select().from(routineExercises).all()).toHaveLength(0);
  });

  it("upserts settings on key conflict", () => {
    const write = (value: string) =>
      db
        .insert(settings)
        .values({ key: "timerSounds", value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run();

    write("true");
    write("false");
    const rows = db.select().from(settings).all();
    expect(rows).toEqual([{ key: "timerSounds", value: "false" }]);
  });
});

describe("declared foreign keys", () => {
  const declared = (table: SQLiteTable) =>
    getTableConfig(table).foreignKeys.map((fk) => {
      const ref = fk.reference();
      return [
        ref.columns[0].name,
        `${getTableConfig(ref.foreignTable).name}.${ref.foreignColumns[0].name}`,
        fk.onDelete ?? "no action",
      ];
    });

  it("cascade only from a routine to its entries and from a session to its sets", () => {
    expect(declared(routineExercises)).toEqual([
      ["routine_id", "routines.id", "cascade"],
      ["exercise_id", "exercises.id", "no action"],
    ]);
    expect(declared(sessions)).toEqual([["routine_id", "routines.id", "no action"]]);
    expect(declared(sessionSets)).toEqual([
      ["session_id", "sessions.id", "cascade"],
      ["exercise_id", "exercises.id", "no action"],
    ]);
    expect(declared(exercises)).toEqual([]);
  });
});
