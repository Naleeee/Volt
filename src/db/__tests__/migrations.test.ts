import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const MIGRATIONS_DIR = path.join(__dirname, "..", "drizzle");

const journal = JSON.parse(
  fs.readFileSync(path.join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8"),
) as { entries: { tag: string }[] };

function applyMigration(sqlite: Database.Database, tag: string) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, `${tag}.sql`), "utf8");
  for (const statement of sql.split("--> statement-breakpoint"))
    sqlite.exec(statement);
}

describe("migrations", () => {
  it("apply cleanly to an empty database", () => {
    const sqlite = new Database(":memory:");
    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_DIR });

    const tables = sqlite
      .prepare<[], { name: string }>(
        "select name from sqlite_master where type = 'table'",
      )
      .all()
      .map((r) => r.name);
    for (const table of [
      "exercises",
      "routines",
      "routine_exercises",
      "sessions",
      "session_sets",
      "settings",
    ])
      expect(tables).toContain(table);
    sqlite.close();
  });

  it("0002 backfills null target_sets and enforces not null", () => {
    const sqlite = new Database(":memory:");
    const [before, ...rest] = journal.entries.map((e) => e.tag);
    const notNullTag = rest.find((t) => t.includes("target-sets-not-null"));
    expect(notNullTag).toBeDefined();
    for (const tag of [before, ...rest.filter((t) => t !== notNullTag)])
      applyMigration(sqlite, tag);

    sqlite.exec(
      "insert into exercises (id, name, measured_by) values (1, 'Bench', 'reps')",
    );
    sqlite.exec(
      "insert into routines (id, name, created_at) values (1, 'Push', 0)",
    );
    sqlite.exec(
      "insert into routine_exercises (routine_id, exercise_id, position, target_sets) values (1, 1, 1, null)",
    );

    applyMigration(sqlite, notNullTag!);

    const row = sqlite
      .prepare<[], { target_sets: number }>(
        "select target_sets from routine_exercises",
      )
      .get();
    expect(row?.target_sets).toBe(1);

    expect(() =>
      sqlite.exec(
        "insert into routine_exercises (routine_id, exercise_id, position, target_sets) values (1, 1, 2, null)",
      ),
    ).toThrow(/NOT NULL/);
    sqlite.close();
  });
});
