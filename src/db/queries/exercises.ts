import { asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { z } from "zod";
import { MEASURED_BY, MEDIA_TYPES, MeasuredBy } from "@/lib/enums";
import { deleteMedia, isStoredName, persistMedia } from "@/lib/media";
import { db } from "../client";
import { exercises } from "../schema";

export const exerciseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  measuredBy: z.enum(MEASURED_BY),
  mediaPath: z.string().nullable(),
  mediaType: z.enum(MEDIA_TYPES).nullable(),
  notes: z.string().trim().max(500),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const EMPTY_EXERCISE: ExerciseFormValues = {
  name: "",
  measuredBy: MeasuredBy.Reps,
  mediaPath: null,
  mediaType: null,
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

// Archived list: most recently archived first.
export function useArchivedExercises() {
  const { data } = useLiveQuery(
    db
      .select()
      .from(exercises)
      .where(isNotNull(exercises.archivedAt))
      .orderBy(desc(exercises.archivedAt), asc(exercises.name)),
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
  const row = toRow(values);
  try {
    const [inserted] = await db.insert(exercises).values(row).returning();
    return inserted;
  } catch (error) {
    // toRow copied a fresh pick into the media dir; don't leak it on failure.
    if (row.mediaPath !== values.mediaPath) deleteMedia(row.mediaPath);
    throw error;
  }
}

export async function updateExercise(id: number, values: ExerciseFormValues) {
  const prev = db
    .select({ mediaPath: exercises.mediaPath })
    .from(exercises)
    .where(eq(exercises.id, id))
    .get();
  const row = toRow(values);
  try {
    await db.update(exercises).set(row).where(eq(exercises.id, id));
  } catch (error) {
    if (row.mediaPath !== values.mediaPath) deleteMedia(row.mediaPath);
    throw error;
  }
  if (prev?.mediaPath && prev.mediaPath !== row.mediaPath)
    deleteMedia(prev.mediaPath);
}

export async function archiveExercise(id: number) {
  await db
    .update(exercises)
    .set({ archivedAt: Date.now() })
    .where(eq(exercises.id, id));
}

export async function unarchiveExercise(id: number) {
  await db
    .update(exercises)
    .set({ archivedAt: null })
    .where(eq(exercises.id, id));
}

function toRow(values: ExerciseFormValues) {
  const parsed = exerciseFormSchema.parse(values);
  const mediaPath =
    parsed.mediaPath && !isStoredName(parsed.mediaPath)
      ? persistMedia(parsed.mediaPath)
      : parsed.mediaPath;
  return {
    ...parsed,
    mediaPath,
    mediaType: mediaPath ? parsed.mediaType : null,
    notes: parsed.notes || null,
  };
}
