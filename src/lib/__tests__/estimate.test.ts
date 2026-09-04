import { MeasuredBy } from "@/lib/enums";
import { estimateRoutineSeconds } from "@/lib/estimate";

const rest = { restBetweenSetsSec: 60, restBetweenExercisesSec: 90 };
const entry = (over: Partial<Parameters<typeof estimateRoutineSeconds>[0][number]>) => ({
  measuredBy: MeasuredBy.Reps as MeasuredBy,
  targetSets: 3,
  targetReps: 10,
  targetTimeSec: null,
  ...over,
});

describe("estimateRoutineSeconds", () => {
  it("is 0 for an empty routine", () => {
    expect(estimateRoutineSeconds([], rest)).toBe(0);
  });

  it("counts 3 s per rep plus rest between sets", () => {
    // 3 sets × 10 reps × 3 s + 2 × 60 s rest
    expect(estimateRoutineSeconds([entry({})], rest)).toBe(210);
  });

  it("uses the hold target for time exercises", () => {
    const e = entry({
      measuredBy: MeasuredBy.Time,
      targetReps: null,
      targetTimeSec: 45,
    });
    // 3 × 45 + 2 × 60
    expect(estimateRoutineSeconds([e], rest)).toBe(255);
  });

  it("assumes 45 s per set for free-form exercises", () => {
    const e = entry({ measuredBy: MeasuredBy.Other, targetReps: null, targetSets: 2 });
    // 2 × 45 + 1 × 60
    expect(estimateRoutineSeconds([e], rest)).toBe(150);
  });

  it("adds rest between exercises", () => {
    expect(estimateRoutineSeconds([entry({}), entry({})], rest)).toBe(
      210 + 210 + 90,
    );
  });
});
