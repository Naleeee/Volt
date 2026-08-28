import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import ExerciseForm from "@/components/exercises/ExerciseForm";
import { colors } from "@/constants/theme";
import { updateExercise, useExercise } from "@/db/queries/exercises";

export default function EditExercise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const exercise = useExercise(exerciseId);

  if (!exercise) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ExerciseForm
      title="Edit Exercise"
      initial={{
        name: exercise.name,
        measuredBy: exercise.measuredBy,
        notes: exercise.notes ?? "",
      }}
      onSave={(values) => updateExercise(exerciseId, values)}
    />
  );
}
