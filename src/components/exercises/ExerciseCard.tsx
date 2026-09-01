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
      className="flex-1 bg-bg h-[180px]"
    >
      {mediaPath ? (
        <MediaThumb
          path={mediaPath}
          type={mediaType}
          className="h-[100px] rounded-t-3xl"
        />
      ) : (
        <View className="flex-row items-center justify-center h-[100px] bg-card2 border border-muted border-dashed rounded-t-3xl">
          <Text className="font-archivo-bold text-sm text-text">No Image</Text>
        </View>
      )}
      <View className="flex-1 justify-between p-4 bg-card rounded-b-3xl border border-t-0 border-muted/50">
        <Text className="font-archivo-bold text-lg text-text">
          {exerciseName}
        </Text>
        <TypeBadge measuredBy={exerciseType} />
      </View>
    </Pressable>
  );
}
