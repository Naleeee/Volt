export type SessionPosition = { exerciseIndex: number; setNumber: number };

type EntryTargets = { exerciseId: number; targetSets: number };
type LoggedSet = { exerciseId: number; setNumber: number };

// Logged sets only carry exercise_id, and the same exercise can appear twice in a routine:
// each set goes to the first entry of that exercise that still has its set number open.
export function groupSetsByEntry<S extends LoggedSet>(
  entries: EntryTargets[],
  sets: S[],
): S[][] {
  const groups: S[][] = entries.map(() => []);
  for (const s of sets) {
    const index = entries.findIndex(
      (e, i) =>
        e.exerciseId === s.exerciseId &&
        s.setNumber <= e.targetSets &&
        !groups[i].some((g) => g.setNumber === s.setNumber),
    );
    if (index !== -1) groups[index].push(s);
  }
  return groups.map((g) => g.sort((a, b) => a.setNumber - b.setNumber));
}

// Set numbers of an entry with no logged row yet, ascending.
export function openSetNumbers(
  entry: { targetSets: number },
  logged: { setNumber: number }[],
): number[] {
  const done = new Set(logged.map((s) => s.setNumber));
  return Array.from({ length: entry.targetSets }, (_, i) => i + 1).filter(
    (n) => !done.has(n),
  );
}

// First open set in routine order, or null when every planned set is logged.
export function nextPosition(
  entries: { targetSets: number }[],
  groups: { setNumber: number }[][],
): SessionPosition | null {
  return nextPositionFrom(entries, groups, 0);
}

// Nearest open set from `index`: the same exercise first, then the following ones, wrapping around.
export function nextPositionFrom(
  entries: { targetSets: number }[],
  groups: { setNumber: number }[][],
  index: number,
): SessionPosition | null {
  for (let step = 0; step < entries.length; step++) {
    const exerciseIndex = (index + step) % entries.length;
    const [setNumber] = openSetNumbers(
      entries[exerciseIndex],
      groups[exerciseIndex],
    );
    if (setNumber !== undefined) return { exerciseIndex, setNumber };
  }
  return null;
}
