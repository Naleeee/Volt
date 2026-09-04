import { filterExercises } from "@/lib/filter-exercises";
import { MeasuredBy } from "@/lib/enums";

const exercises = [
  { name: "Bench Press", measuredBy: MeasuredBy.Reps as MeasuredBy },
  { name: "Plank", measuredBy: MeasuredBy.Time as MeasuredBy },
  { name: "Farmer Carry", measuredBy: MeasuredBy.Other as MeasuredBy },
];

describe("filterExercises", () => {
  it("returns everything for an empty query and 'all'", () => {
    expect(filterExercises(exercises, "", "all")).toEqual(exercises);
  });

  it("matches names case-insensitively and trims the query", () => {
    expect(filterExercises(exercises, "  bench ", "all")).toEqual([
      exercises[0],
    ]);
  });

  it("filters by measurement type", () => {
    expect(filterExercises(exercises, "", MeasuredBy.Time)).toEqual([
      exercises[1],
    ]);
  });

  it("combines query and type filter", () => {
    expect(filterExercises(exercises, "plank", MeasuredBy.Reps)).toEqual([]);
  });
});
