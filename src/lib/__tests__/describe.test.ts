import type { SessionSet } from "@/db/schema";
import {
  describeEntry,
  describeTargetChip,
  describeTargets,
} from "@/lib/describe-entry";
import { describeSet } from "@/lib/describe-set";
import { MeasuredBy } from "@/lib/enums";

const set = (over: Partial<SessionSet>): SessionSet => ({
  id: 1,
  sessionId: 1,
  exerciseId: 1,
  setNumber: 1,
  reps: null,
  timeSec: null,
  weightKg: null,
  note: null,
  skipped: false,
  completedAt: 0,
  ...over,
});

describe("describeSet", () => {
  it("formats reps with and without weight", () => {
    expect(describeSet(set({ reps: 8, weightKg: 60 }), MeasuredBy.Reps)).toBe(
      "8 @ 60 kg",
    );
    expect(describeSet(set({ reps: 8 }), MeasuredBy.Reps)).toBe("8");
  });

  it("drops units in short mode", () => {
    expect(
      describeSet(set({ reps: 8, weightKg: 60 }), MeasuredBy.Reps, true),
    ).toBe("8 @ 60");
    expect(describeSet(set({ timeSec: 45 }), MeasuredBy.Time, true)).toBe(
      "45 s",
    );
  });

  it("formats time and free-form sets", () => {
    expect(describeSet(set({ timeSec: 45 }), MeasuredBy.Time)).toBe("45 sec");
    expect(describeSet(set({ note: "2 × 20 m" }), MeasuredBy.Other)).toBe(
      "2 × 20 m",
    );
    expect(describeSet(set({}), MeasuredBy.Other)).toBe("–");
  });

  it("dashes out missing reps and time", () => {
    expect(describeSet(set({}), MeasuredBy.Reps)).toBe("–");
    expect(describeSet(set({ weightKg: 60 }), MeasuredBy.Reps)).toBe("– @ 60 kg");
    expect(describeSet(set({}), MeasuredBy.Time)).toBe("– sec");
    expect(describeSet(set({}), MeasuredBy.Time, true)).toBe("– s");
  });
});

const entry = (over: Partial<Parameters<typeof describeEntry>[0]>) => ({
  measuredBy: MeasuredBy.Reps as MeasuredBy,
  targetSets: 3,
  targetReps: 8,
  targetTimeSec: null,
  targetWeightKg: null,
  ...over,
});

describe("describeEntry", () => {
  it("formats reps targets with optional weight", () => {
    expect(describeEntry(entry({}))).toBe("3 × 8 reps");
    expect(describeEntry(entry({ targetWeightKg: 60 }))).toBe(
      "3 × 8 reps · 60 kg",
    );
  });

  it("formats time and free-form targets", () => {
    expect(
      describeEntry(
        entry({ measuredBy: MeasuredBy.Time, targetReps: null, targetTimeSec: 45 }),
      ),
    ).toBe("3 × 45 sec");
    expect(
      describeEntry(
        entry({ measuredBy: MeasuredBy.Other, targetReps: null, targetSets: 1 }),
      ),
    ).toBe("1 set");
  });

  it("splits head and tail for styled rendering", () => {
    expect(describeTargets(entry({ targetWeightKg: 60 }))).toEqual({
      head: "3 × 8",
      tail: "reps · 60 kg",
    });
  });

  it("falls back to a dash for missing targets", () => {
    expect(describeEntry(entry({ targetReps: null }))).toBe("3 × – reps");
    expect(describeEntry(entry({ measuredBy: MeasuredBy.Time, targetReps: null }))).toBe("3 × – sec");
  });

  it("adds weight to holds and pluralises free-form sets", () => {
    expect(
      describeEntry(entry({ measuredBy: MeasuredBy.Time, targetTimeSec: 45, targetWeightKg: 10 })),
    ).toBe("3 × 45 sec · 10 kg");
    expect(describeEntry(entry({ measuredBy: MeasuredBy.Other }))).toBe("3 sets");
  });
});

describe("describeTargetChip", () => {
  it("splits the target chip from the weight", () => {
    expect(describeTargetChip(entry({ targetSets: 4, targetWeightKg: 60 }))).toEqual({
      target: "4 sets × 8 reps",
      weight: "60 kg",
    });
    expect(
      describeTargetChip(
        entry({ measuredBy: MeasuredBy.Time, targetReps: null, targetTimeSec: 45 }),
      ),
    ).toEqual({ target: "3 sets × 45 sec", weight: null });
  });

  it("singularises one set and ignores weight on free-form entries", () => {
    expect(describeTargetChip(entry({ targetSets: 1 })).target).toBe("1 set × 8 reps");
    expect(
      describeTargetChip(entry({ measuredBy: MeasuredBy.Other, targetWeightKg: 10 })),
    ).toEqual({ target: "3 sets", weight: null });
  });
});
