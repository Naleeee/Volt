import type { MeasuredByFilter } from "@/constants/exercises";
import type { Exercise } from "@/db/schema";

export function filterExercises<E extends Pick<Exercise, "name" | "measuredBy">>(
  exercises: E[],
  query: string,
  filter: MeasuredByFilter,
): E[] {
  const needle = query.trim().toLowerCase();
  return exercises.filter(
    (e) =>
      (filter === "all" || e.measuredBy === filter) &&
      e.name.toLowerCase().includes(needle),
  );
}
