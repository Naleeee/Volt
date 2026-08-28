import { asc, eq, isNull, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { z } from "zod";
import { MEASURED_BY, MeasuredBy } from "@/lib/enums";
import { db } from "../client";
import { exercises, routineExercises, routines, type Exercise } from "../schema";

export type RoutineSummary = {
  id: number;
  name: string;
  exerciseCount: number;
  lastPerformedAt: number | null;
};

// Live on the `routines` table only: useLiveQuery watches the `from` table, so writes to
// routine_exercises or sessions alone don't re-run this until a routine row changes.
export function useRoutines(): RoutineSummary[] {
  const { data } = useLiveQuery(
    db
      .select({
        id: routines.id,
        name: routines.name,
        exerciseCount: sql<number>`(select count(*) from routine_exercises re where re.routine_id = ${routines.id})`.mapWith(Number),
        lastPerformedAt: sql<number | null>`(select max(s.ended_at) from sessions s where s.routine_id = ${routines.id})`,
      })
      .from(routines)
      .where(isNull(routines.archivedAt))
      .orderBy(asc(routines.createdAt)),
  );
  return data;
}

// ── Builder form ──────────────────────────────────────────────────────────────

const entrySchema = z.object({
  exerciseId: z.number().int(),
  name: z.string(),
  measuredBy: z.enum(MEASURED_BY),
  targetSets: z.number().int().min(1, "At least 1 set"),
  targetReps: z.number().int().min(1).nullable(),
  targetTimeSec: z.number().int().min(5).nullable(),
  targetWeightKg: z.number().min(0).nullable(),
});

export const routineFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  entries: z.array(entrySchema).min(1, "Add at least one exercise"),
});

export type RoutineEntry = z.infer<typeof entrySchema>;
export type RoutineFormValues = z.infer<typeof routineFormSchema>;

export const EMPTY_ROUTINE: RoutineFormValues = { name: "", entries: [] };

export function defaultEntry(
  exercise: Pick<Exercise, "id" | "name" | "measuredBy">,
): RoutineEntry {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    measuredBy: exercise.measuredBy,
    targetSets: 3,
    targetReps: exercise.measuredBy === MeasuredBy.Reps ? 10 : null,
    targetTimeSec: exercise.measuredBy === MeasuredBy.Time ? 30 : null,
    targetWeightKg: null,
  };
}

// Edit screen: undefined until both the routine row and its entries have loaded.
export function useRoutineForm(id: number): RoutineFormValues | undefined {
  const routine = useLiveQuery(
    db.select({ name: routines.name }).from(routines).where(eq(routines.id, id)),
    [id],
  );
  const entries = useLiveQuery(
    db
      .select({
        exerciseId: routineExercises.exerciseId,
        name: exercises.name,
        measuredBy: exercises.measuredBy,
        targetSets: routineExercises.targetSets,
        targetReps: routineExercises.targetReps,
        targetTimeSec: routineExercises.targetTimeSec,
        targetWeightKg: routineExercises.targetWeightKg,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
      .where(eq(routineExercises.routineId, id))
      .orderBy(asc(routineExercises.position)),
    [id],
  );

  const row = routine.data[0];
  if (!routine.updatedAt || !entries.updatedAt || !row) return undefined;
  return {
    name: row.name,
    entries: entries.data.map((e) => ({ ...e, targetSets: e.targetSets ?? 1 })),
  };
}

export function insertRoutine(values: RoutineFormValues) {
  const { name, entries } = routineFormSchema.parse(values);
  return db.transaction((tx) => {
    const routine = tx
      .insert(routines)
      .values({ name, createdAt: Date.now() })
      .returning({ id: routines.id })
      .get();
    tx.insert(routineExercises)
      .values(entries.map((e, i) => toEntryRow(routine.id, e, i)))
      .run();
    return routine;
  });
}

// Entries are replaced wholesale; session_sets reference exercises, not routine_exercises, so nothing dangles.
export function updateRoutine(id: number, values: RoutineFormValues) {
  const { name, entries } = routineFormSchema.parse(values);
  db.transaction((tx) => {
    tx.update(routines).set({ name }).where(eq(routines.id, id)).run();
    tx.delete(routineExercises).where(eq(routineExercises.routineId, id)).run();
    tx.insert(routineExercises)
      .values(entries.map((e, i) => toEntryRow(id, e, i)))
      .run();
  });
}

function toEntryRow(routineId: number, e: RoutineEntry, index: number) {
  return {
    routineId,
    exerciseId: e.exerciseId,
    position: index + 1,
    targetSets: e.targetSets,
    targetReps: e.targetReps,
    targetTimeSec: e.targetTimeSec,
    targetWeightKg: e.targetWeightKg,
  };
}
