import { MeasuredBy } from "@/lib/enums";
import { formatWeight } from "@/lib/format";

type Targets = {
  measuredBy: MeasuredBy;
  targetSets: number;
  targetReps: number | null;
  targetTimeSec: number | null;
  targetWeightKg: number | null;
};

// "4 × 8" + "reps · 60 kg" · "3 × 45" + "sec" · "3" + "sets" — split so the head can be styled.
export function describeTargets(entry: Targets) {
  const weight =
    entry.targetWeightKg !== null
      ? ` · ${formatWeight(entry.targetWeightKg)}`
      : "";
  switch (entry.measuredBy) {
    case MeasuredBy.Reps:
      return {
        head: `${entry.targetSets} × ${entry.targetReps ?? "–"}`,
        tail: `reps${weight}`,
      };
    case MeasuredBy.Time:
      return {
        head: `${entry.targetSets} × ${entry.targetTimeSec ?? "–"}`,
        tail: `sec${weight}`,
      };
    default:
      return {
        head: String(entry.targetSets),
        tail: entry.targetSets === 1 ? "set" : "sets",
      };
  }
}

// "4 × 8 reps · 60 kg" — the single-string form.
export function describeEntry(entry: Targets) {
  const { head, tail } = describeTargets(entry);
  return `${head} ${tail}`;
}

// "4 sets × 8 reps" + "60 kg" — the detail row chips the target and mutes the weight.
export function describeTargetChip(entry: Targets) {
  const sets = `${entry.targetSets} ${entry.targetSets === 1 ? "set" : "sets"}`;
  const weight =
    entry.targetWeightKg !== null ? formatWeight(entry.targetWeightKg) : null;
  switch (entry.measuredBy) {
    case MeasuredBy.Reps:
      return { target: `${sets} × ${entry.targetReps ?? "–"} reps`, weight };
    case MeasuredBy.Time:
      return { target: `${sets} × ${entry.targetTimeSec ?? "–"} sec`, weight };
    default:
      return { target: sets, weight: null };
  }
}
