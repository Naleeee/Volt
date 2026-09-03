export type SessionPosition = { exerciseIndex: number; setNumber: number };

type EntryTargets = { exerciseId: number; targetSets: number };

// Logged sets only carry exercise_id, and the same exercise can appear twice in a routine:
// hand sets to entries in routine order, each entry taking at most its target.
export function groupSetsByEntry<S extends { exerciseId: number }>(
  entries: EntryTargets[],
  sets: S[],
): S[][] {
  const pool = new Map<number, S[]>();
  for (const s of sets)
    pool.set(s.exerciseId, [...(pool.get(s.exerciseId) ?? []), s]);
  return entries.map((e) => {
    const available = pool.get(e.exerciseId) ?? [];
    const taken = available.slice(0, e.targetSets);
    pool.set(e.exerciseId, available.slice(taken.length));
    return taken;
  });
}

export function allocateLoggedSets(
  entries: EntryTargets[],
  sets: { exerciseId: number }[],
): number[] {
  return groupSetsByEntry(entries, sets).map((group) => group.length);
}

// First entry with sets left, or null when every planned set is logged.
export function nextPosition(
  entries: { targetSets: number }[],
  done: number[],
): SessionPosition | null {
  const exerciseIndex = done.findIndex((d, i) => d < entries[i].targetSets);
  return exerciseIndex === -1
    ? null
    : { exerciseIndex, setNumber: done[exerciseIndex] + 1 };
}
