import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import RoutineForm from "@/components/routines/RoutineForm";
import { colors } from "@/constants/theme";
import { updateRoutine, useRoutine } from "@/db/queries/routines";

export default function EditRoutine() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const initial = useRoutine(routineId);

  // The form reads defaultValues once at mount, so wait for the rows before mounting it.
  if (!initial) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <RoutineForm
      title="Edit routine"
      initial={initial}
      onSave={(values) => updateRoutine(routineId, values)}
    />
  );
}
