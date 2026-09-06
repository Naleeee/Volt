import { Text, View } from "react-native";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import type { RoutineEntry } from "@/db/queries/routines";
import { describeTargetChip } from "@/lib/describe-entry";

export default function RoutineExerciseRow({ entry }: { entry: RoutineEntry }) {
  const { target, weight } = describeTargetChip(entry);
  const type = MEASURED_BY_STYLES[entry.measuredBy];
  return (
    <View
      className={`flex-row items-center gap-3 bg-card border border-line border-l-4 ${type.edge} rounded-2xl py-2 pl-3 pr-3.5`}
    >
      <MediaThumb
        path={entry.mediaPath}
        type={entry.mediaType}
        className="w-12 h-12 rounded-xl"
      />
      <View className="flex-1">
        <Text className="font-archivo-bold text-base text-text" numberOfLines={1}>
          {entry.name}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <View className={`rounded-md px-2 py-0.5 ${type.chip}`}>
            <Text className={`font-archivo-bold text-xs ${type.text}`}>{target}</Text>
          </View>
          {weight ? (
            <Text className="font-archivo-semibold text-sm text-muted">{weight}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
