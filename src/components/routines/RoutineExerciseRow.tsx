import { Text, View } from "react-native";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import type { RoutineEntry } from "@/db/queries/routines";
import { MeasuredBy } from "@/lib/enums";
import { formatWeight } from "@/lib/format";

export default function RoutineExerciseRow({ entry }: { entry: RoutineEntry }) {
  const { head, tail } = describeTargets(entry);
  const type = MEASURED_BY_STYLES[entry.measuredBy];
  return (
    <View className="flex-row items-center gap-2.5 bg-card border border-line rounded-[18px] py-1.5 px-3">
      <MediaThumb
        path={entry.mediaPath}
        type={entry.mediaType}
        className="w-11 h-11 rounded-xl"
      />
      <View className="flex-1">
        <Text className="font-archivo-bold text-[15px] text-text" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text className="font-archivo text-[13px] text-muted mt-0.5">
          <Text className={`font-archivo-bold ${type.text}`}>{head}</Text> {tail}
        </Text>
      </View>
    </View>
  );
}

// "4 × 8" + "reps · 60 kg" · "3 × 45" + "sec" · "3" + "sets"
function describeTargets(entry: RoutineEntry) {
  const weight = entry.targetWeightKg !== null ? ` · ${formatWeight(entry.targetWeightKg)}` : "";
  switch (entry.measuredBy) {
    case MeasuredBy.Reps:
      return { head: `${entry.targetSets} × ${entry.targetReps ?? "–"}`, tail: `reps${weight}` };
    case MeasuredBy.Time:
      return { head: `${entry.targetSets} × ${entry.targetTimeSec ?? "–"}`, tail: `sec${weight}` };
    default:
      return { head: String(entry.targetSets), tail: entry.targetSets === 1 ? "set" : "sets" };
  }
}
