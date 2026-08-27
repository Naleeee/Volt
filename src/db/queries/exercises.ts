import { asc, eq, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { z } from "zod";
import { MEASURED_BY, MeasuredBy } from "@/lib/enums";
import { db } from "../client";
import { exercises } from "../schema";

export const exerciseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  measuredBy: z.enum(MEASURED_BY),
  notes: z.string().trim().max(500),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const EMPTY_EXERCISE: ExerciseFormValues = {
  name: "",
  measuredBy: MeasuredBy.Reps,
  notes: "",
};

// Library list: active exercises A→Z, re-renders on any write to the table.
export function useExercises() {
  const { data } = useLiveQuery(
    db
      .select()
      .from(exercises)
      .where(isNull(exercises.archivedAt))
      .orderBy(asc(exercises.name)),
  );
  return data;
}

// Edit screen: undefined while loading or when the id doesn't exist.
export function useExercise(id: number) {
  const { data } = useLiveQuery(
    db.select().from(exercises).where(eq(exercises.id, id)),
    [id],
  );
  return data[0];
}

export async function insertExercise(values: ExerciseFormValues) {
  const [row] = await db.insert(exercises).values(toRow(values)).returning();
  return row;
}

export async function updateExercise(id: number, values: ExerciseFormValues) {
  await db.update(exercises).set(toRow(values)).where(eq(exercises.id, id));
}

// Empty notes are stored as NULL, not "".
function toRow(values: ExerciseFormValues) {
  const parsed = exerciseFormSchema.parse(values);
  return { ...parsed, notes: parsed.notes || null };
}
