import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../schema";

// In-memory stand-in for the expo-sqlite client so query modules run under Jest.
export const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.join(__dirname, "..", "drizzle") });

export function resetDb() {
  sqlite.exec(
    "delete from session_sets; delete from sessions; delete from routine_exercises; delete from routines; delete from exercises; delete from settings;",
  );
}
