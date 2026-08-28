import type { Settings } from "@/db/queries/settings";

export function restDurationFor(
  entry: { restOverrideSec: number | null },
  settings: Pick<Settings, "restBetweenSetsSec" | "restBetweenExercisesSec">,
  afterLastSetOfExercise: boolean,
) {
  return (
    entry.restOverrideSec ??
    (afterLastSetOfExercise ? settings.restBetweenExercisesSec : settings.restBetweenSetsSec)
  );
}
