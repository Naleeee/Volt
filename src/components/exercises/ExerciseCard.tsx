import { Pressable, Image, Text, View } from "react-native";
import { MeasuredBy } from "@/lib/enums";
import TypeBadge from "./TypeBadge";

interface ExerciseCardProps {
  exerciseName: string;
  imageUrl?: string;
  exerciseType: MeasuredBy;
}

export default function ExerciseCard({
  exerciseName,
  imageUrl,
  exerciseType,
}: ExerciseCardProps) {
  return (
    <Pressable className="flex-1 bg-bg h-[180px]">
      <View className="flex-row items-center justify-center h-[100px] bg-card2 border border-muted border-dashed rounded-t-3xl">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <Text className="font-archivo-bold text-sm text-text">No Image</Text>
        )}
      </View>
      <View className="flex-1 justify-between p-4 bg-card rounded-b-3xl border border-t-0 border-muted">
        <Text className="font-archivo-bold text-lg text-text">
          {exerciseName}
        </Text>
        <TypeBadge measuredBy={exerciseType} />
      </View>
    </Pressable>
  );
}
