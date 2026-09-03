import { Pressable, Text, View } from "react-native";
import MediaThumb from "@/components/UI/MediaThumb";
import { MeasuredBy, MediaType } from "@/lib/enums";
import TypeBadge from "./TypeBadge";
import { router } from "expo-router";

interface ExerciseCardProps {
  exerciseId: number;
  exerciseName: string;
  mediaPath: string | null;
  mediaType: MediaType | null;
  exerciseType: MeasuredBy;
}

export default function ExerciseCard({
  exerciseId,
  exerciseName,
  mediaPath,
  mediaType,
  exerciseType,
}: ExerciseCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/exercise/${exerciseId}`)}
      accessibilityRole="button"
      className="flex-1 max-w-[50%] bg-bg h-70 active:opacity-80"
    >
      {mediaPath ? (
        <MediaThumb
          path={mediaPath}
          type={mediaType}
          className="h-40 rounded-t-3xl"
        />
      ) : (
        <View className="flex-row items-center justify-center h-40 bg-card2 border border-muted border-dashed rounded-t-3xl">
          <Text className="font-archivo-bold text-sm text-text">No Image</Text>
        </View>
      )}
      <View className="flex-1 flex-row justify-between items-center gap-2 p-4 bg-card rounded-b-3xl border border-t-0 border-muted/50">
        <Text
          className="flex-1 font-archivo-bold text-sm text-text"
          numberOfLines={1}
        >
          {exerciseName}
        </Text>
        <TypeBadge measuredBy={exerciseType} />
      </View>
    </Pressable>
  );
}
