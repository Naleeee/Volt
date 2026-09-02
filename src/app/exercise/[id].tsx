import { useLocalSearchParams } from "expo-router";
import ExerciseForm from "@/components/exercises/ExerciseForm";
import LoadingScreen from "@/components/UI/LoadingScreen";
import {
  updateExercise,
  useExercise,
  archiveExercise,
} from "@/db/queries/exercises";

export default function EditExercise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const exercise = useExercise(exerciseId);

  if (!exercise) return <LoadingScreen />;

  return (
    <ExerciseForm
      title="Edit Exercise"
      initial={{
        name: exercise.name,
        measuredBy: exercise.measuredBy,
        mediaPath: exercise.mediaPath,
        mediaType: exercise.mediaType,
        notes: exercise.notes ?? "",
      }}
      onSave={(values) => updateExercise(exerciseId, values)}
      onArchive={() => archiveExercise(exerciseId)}
    />
  );
}
