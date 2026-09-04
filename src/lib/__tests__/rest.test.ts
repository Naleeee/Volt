import { restDurationFor } from "@/lib/rest";

const settings = { restBetweenSetsSec: 45, restBetweenExercisesSec: 90 };

describe("restDurationFor", () => {
  it("uses the between-sets default mid-exercise", () => {
    expect(restDurationFor({ restOverrideSec: null }, settings, false)).toBe(45);
  });

  it("uses the between-exercises default after the last set", () => {
    expect(restDurationFor({ restOverrideSec: null }, settings, true)).toBe(90);
  });

  it("lets a per-exercise override win in both cases", () => {
    expect(restDurationFor({ restOverrideSec: 120 }, settings, false)).toBe(120);
    expect(restDurationFor({ restOverrideSec: 120 }, settings, true)).toBe(120);
  });
});
