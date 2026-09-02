import { useLocalSearchParams } from "expo-router";
import RoutineForm from "@/components/routines/RoutineForm";
import LoadingScreen from "@/components/UI/LoadingScreen";
import { updateRoutine, useRoutine } from "@/db/queries/routines";

export default function EditRoutine() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const initial = useRoutine(routineId);

  // The form reads defaultValues once at mount, so wait for the rows before mounting it.
  if (!initial) return <LoadingScreen />;

  return (
    <RoutineForm
      title="Edit routine"
      initial={initial}
      onSave={(values) => updateRoutine(routineId, values)}
    />
  );
}
