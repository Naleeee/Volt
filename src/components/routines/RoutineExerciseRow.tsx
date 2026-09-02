import { Text, View } from "react-native";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import type { RoutineEntry } from "@/db/queries/routines";
import { describeTargets } from "@/lib/describe-entry";

export default function RoutineExerciseRow({ entry }: { entry: RoutineEntry }) {
  const { head, tail } = describeTargets(entry);
  const type = MEASURED_BY_STYLES[entry.measuredBy];
  return (
    <View className="flex-row items-center gap-2.5 bg-card border border-line rounded-2xl py-1.5 px-3">
      <MediaThumb
        path={entry.mediaPath}
        type={entry.mediaType}
        className="w-11 h-11 rounded-xl"
      />
      <View className="flex-1">
        <Text className="font-archivo-bold text-base text-text" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text className="font-archivo text-sm text-muted mt-0.5">
          <Text className={`font-archivo-bold ${type.text}`}>{head}</Text> {tail}
        </Text>
      </View>
    </View>
  );
}
