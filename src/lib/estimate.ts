import { MeasuredBy } from "./enums";

const SECONDS_PER_REP = 3;
const OTHER_SET_SEC = 45;

type Entry = {
  measuredBy: MeasuredBy;
  targetSets: number;
  targetReps: number | null;
  targetTimeSec: number | null;
};

type Rest = { restBetweenSetsSec: number; restBetweenExercisesSec: number };

// Rough planning estimate: work per set + rest between sets, plus rest between exercises.
export function estimateRoutineSeconds(entries: Entry[], rest: Rest) {
  const work = entries.reduce((total, e) => {
    const perSet =
      e.measuredBy === MeasuredBy.Reps
        ? (e.targetReps ?? 0) * SECONDS_PER_REP
        : e.measuredBy === MeasuredBy.Time
          ? (e.targetTimeSec ?? 0)
          : OTHER_SET_SEC;
    return total + e.targetSets * perSet + Math.max(0, e.targetSets - 1) * rest.restBetweenSetsSec;
  }, 0);
  return work + Math.max(0, entries.length - 1) * rest.restBetweenExercisesSec;
}
