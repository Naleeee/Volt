import ExerciseForm from "@/components/exercises/ExerciseForm";
import { EMPTY_EXERCISE, insertExercise } from "@/db/queries/exercises";

export default function NewExercise() {
  return (
    <ExerciseForm
      title="New Exercise"
      initial={EMPTY_EXERCISE}
      onSave={insertExercise}
    />
  );
}
