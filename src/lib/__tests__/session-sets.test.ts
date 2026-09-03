import {
  allocateLoggedSets,
  groupSetsByEntry,
  nextPosition,
} from "@/lib/session-sets";

const set = (exerciseId: number, id: number) => ({ exerciseId, id });

describe("groupSetsByEntry", () => {
  it("hands sets to entries in routine order", () => {
    const entries = [
      { exerciseId: 1, targetSets: 2 },
      { exerciseId: 2, targetSets: 1 },
    ];
    const sets = [set(1, 10), set(2, 11), set(1, 12)];
    expect(groupSetsByEntry(entries, sets)).toEqual([
      [set(1, 10), set(1, 12)],
      [set(2, 11)],
    ]);
  });

  it("splits sets of a duplicated exercise across its entries", () => {
    const entries = [
      { exerciseId: 1, targetSets: 2 },
      { exerciseId: 2, targetSets: 1 },
      { exerciseId: 1, targetSets: 2 },
    ];
    const sets = [set(1, 10), set(1, 11), set(1, 12)];
    expect(groupSetsByEntry(entries, sets)).toEqual([
      [set(1, 10), set(1, 11)],
      [],
      [set(1, 12)],
    ]);
  });

  it("caps each entry at its target", () => {
    const entries = [{ exerciseId: 1, targetSets: 1 }];
    expect(groupSetsByEntry(entries, [set(1, 10), set(1, 11)])).toEqual([
      [set(1, 10)],
    ]);
  });

  it("returns empty groups when nothing is logged", () => {
    expect(groupSetsByEntry([{ exerciseId: 1, targetSets: 3 }], [])).toEqual([
      [],
    ]);
  });
});

describe("allocateLoggedSets", () => {
  it("returns the count per entry", () => {
    const entries = [
      { exerciseId: 1, targetSets: 2 },
      { exerciseId: 1, targetSets: 2 },
    ];
    const sets = [set(1, 10), set(1, 11), set(1, 12)];
    expect(allocateLoggedSets(entries, sets)).toEqual([2, 1]);
  });
});

describe("nextPosition", () => {
  const entries = [{ targetSets: 2 }, { targetSets: 1 }, { targetSets: 2 }];

  it("points at the first entry with sets left", () => {
    expect(nextPosition(entries, [0, 0, 0])).toEqual({
      exerciseIndex: 0,
      setNumber: 1,
    });
    expect(nextPosition(entries, [2, 0, 0])).toEqual({
      exerciseIndex: 1,
      setNumber: 1,
    });
    expect(nextPosition(entries, [2, 1, 1])).toEqual({
      exerciseIndex: 2,
      setNumber: 2,
    });
  });

  it("returns null when every planned set is logged", () => {
    expect(nextPosition(entries, [2, 1, 2])).toBeNull();
  });
});
