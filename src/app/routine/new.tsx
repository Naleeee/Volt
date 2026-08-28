import RoutineForm from "@/components/routines/RoutineForm";
import { EMPTY_ROUTINE, insertRoutine } from "@/db/queries/routines";

export default function NewRoutine() {
  return (
    <RoutineForm title="New routine" initial={EMPTY_ROUTINE} onSave={insertRoutine} />
  );
}
