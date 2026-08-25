import { db } from "./client";
import { exercises, routineExercises, routines } from "./schema";

export async function seedIfEmpty() {
  const existing = await db.select({ id: routines.id }).from(routines).limit(1);
  if (existing.length > 0) return;

  const [bench] = await db
    .insert(exercises)
    .values({ name: "Bench Press", measuredBy: "reps" })
    .returning({ id: exercises.id });
  const [plank] = await db
    .insert(exercises)
    .values({ name: "Plank", measuredBy: "time" })
    .returning({ id: exercises.id });

  const [routine] = await db
    .insert(routines)
    .values({ name: "Push Day", createdAt: Date.now() })
    .returning({ id: routines.id });

  await db.insert(routineExercises).values([
    {
      routineId: routine.id,
      exerciseId: bench.id,
      position: 1,
      targetSets: 3,
      targetReps: 8,
      targetWeightKg: 60,
    },
    {
      routineId: routine.id,
      exerciseId: plank.id,
      position: 2,
      targetSets: 3,
      targetTimeSec: 45,
    },
  ]);
}
