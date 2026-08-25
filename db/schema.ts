import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { MEASURED_BY, MEDIA_TYPES } from "@/lib/enums";

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  measuredBy: text("measured_by", { enum: MEASURED_BY }).notNull(),
  mediaPath: text("media_path"),
  mediaType: text("media_type", { enum: MEDIA_TYPES }),
  notes: text("notes"),
  restOverrideSec: integer("rest_override_sec"),
  archivedAt: integer("archived_at"),
});

export const routines = sqliteTable("routines", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
  archivedAt: integer("archived_at"),
});

export const routineExercises = sqliteTable("routine_exercises", {
  id: integer("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  position: integer("position").notNull(),
  targetSets: integer("target_sets"),
  targetReps: integer("target_reps"),
  targetTimeSec: integer("target_time_sec"),
  targetWeightKg: real("target_weight_kg"),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routines.id),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
});

export const sessionSets = sqliteTable("session_sets", {
  id: integer("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  timeSec: integer("time_sec"),
  weightKg: real("weight_kg"),
  note: text("note"),
  completedAt: integer("completed_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
