import type { SessionSet } from "@/db/schema";
import { MeasuredBy } from "./enums";
import { formatWeight } from "./format";

// "8 @ 60 kg" · "45 sec" · the note. `short` drops units for the table's LAST column ("8 @ 60").
export function describeSet(set: SessionSet, measuredBy: MeasuredBy, short = false) {
  switch (measuredBy) {
    case MeasuredBy.Reps: {
      const reps = set.reps ?? "–";
      if (set.weightKg === null) return `${reps}`;
      return short ? `${reps} @ ${set.weightKg}` : `${reps} @ ${formatWeight(set.weightKg)}`;
    }
    case MeasuredBy.Time:
      return short ? `${set.timeSec ?? "–"} s` : `${set.timeSec ?? "–"} sec`;
    default:
      return set.note ?? "–";
  }
}
