import {
  groupSetsByEntry,
  nextPosition,
  nextPositionFrom,
  openSetNumbers,
} from "@/lib/session-sets";

const set = (exerciseId: number, setNumber: number, id = 0) => ({
  exerciseId,
  setNumber,
  id,
});

describe("groupSetsByEntry", () => {
  it("hands sets to entries by exercise and sorts them by set number", () => {
    const entries = [
      { exerciseId: 1, targetSets: 2 },
      { exerciseId: 2, targetSets: 1 },
    ];
    const sets = [set(1, 2, 10), set(2, 1, 11), set(1, 1, 12)];
    expect(groupSetsByEntry(entries, sets)).toEqual([
      [set(1, 1, 12), set(1, 2, 10)],
      [set(2, 1, 11)],
    ]);
  });

  it("splits sets of a duplicated exercise across its entries", () => {
    const entries = [
      { exerciseId: 1, targetSets: 2 },
      { exerciseId: 2, targetSets: 1 },
      { exerciseId: 1, targetSets: 2 },
    ];
    const sets = [set(1, 1, 10), set(1, 2, 11), set(1, 1, 12)];
    expect(groupSetsByEntry(entries, sets)).toEqual([
      [set(1, 1, 10), set(1, 2, 11)],
      [],
      [set(1, 1, 12)],
    ]);
  });

  it("drops sets beyond an entry's target", () => {
    const entries = [{ exerciseId: 1, targetSets: 1 }];
    expect(groupSetsByEntry(entries, [set(1, 1, 10), set(1, 2, 11)])).toEqual([
      [set(1, 1, 10)],
    ]);
  });

  it("returns empty groups when nothing is logged", () => {
    expect(groupSetsByEntry([{ exerciseId: 1, targetSets: 3 }], [])).toEqual([
      [],
    ]);
  });
});

describe("openSetNumbers", () => {
  it("lists the unlogged set numbers in order", () => {
    expect(openSetNumbers({ targetSets: 4 }, [set(1, 3), set(1, 1)])).toEqual([2, 4]);
    expect(openSetNumbers({ targetSets: 2 }, [set(1, 1), set(1, 2)])).toEqual([]);
  });
});

describe("nextPosition", () => {
  const entries = [{ targetSets: 2 }, { targetSets: 1 }, { targetSets: 2 }];
  const logged = (...numbers: number[][]) =>
    numbers.map((ns) => ns.map((n) => ({ setNumber: n })));

  it("points at the first open set in routine order", () => {
    expect(nextPosition(entries, logged([], [], []))).toEqual({
      exerciseIndex: 0,
      setNumber: 1,
    });
    expect(nextPosition(entries, logged([1, 2], [], []))).toEqual({
      exerciseIndex: 1,
      setNumber: 1,
    });
    expect(nextPosition(entries, logged([2], [1], [1]))).toEqual({
      exerciseIndex: 0,
      setNumber: 1,
    });
  });

  it("returns null when every planned set is logged", () => {
    expect(nextPosition(entries, logged([1, 2], [1], [1, 2]))).toBeNull();
    expect(nextPosition([], [])).toBeNull();
  });

  it("from an index prefers the same exercise, then the following ones, then wraps", () => {
    expect(nextPositionFrom(entries, logged([1], [], []), 0)).toEqual({
      exerciseIndex: 0,
      setNumber: 2,
    });
    expect(nextPositionFrom(entries, logged([1, 2], [], []), 0)).toEqual({
      exerciseIndex: 1,
      setNumber: 1,
    });
    expect(nextPositionFrom(entries, logged([1], [1], [1, 2]), 2)).toEqual({
      exerciseIndex: 0,
      setNumber: 2,
    });
  });
});
