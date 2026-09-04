import { startOfWeek, subWeeks } from "date-fns";
import { streakWeeks, WEEK } from "@/lib/streak";

// Wednesday 2 Sep 2026 → week starts Monday 31 Aug 2026.
const weekStart = startOfWeek(new Date(2026, 8, 2), WEEK).getTime();
const weeksAgo = (n: number, offsetMs = 0) =>
  subWeeks(weekStart, n).getTime() + offsetMs;

describe("streakWeeks", () => {
  it("is 0 with no sessions", () => {
    expect(streakWeeks([], weekStart)).toBe(0);
  });

  it("counts consecutive weeks back from this week", () => {
    const starts = [weeksAgo(0), weeksAgo(1), weeksAgo(2)];
    expect(streakWeeks(starts, weekStart)).toBe(3);
  });

  it("counts a week once regardless of session count", () => {
    const starts = [weeksAgo(0), weeksAgo(0, 3600_000), weeksAgo(1)];
    expect(streakWeeks(starts, weekStart)).toBe(2);
  });

  it("keeps the streak while the current week is still empty", () => {
    const starts = [weeksAgo(1), weeksAgo(2)];
    expect(streakWeeks(starts, weekStart)).toBe(2);
  });

  it("breaks on a gap week", () => {
    const starts = [weeksAgo(0), weeksAgo(2), weeksAgo(3)];
    expect(streakWeeks(starts, weekStart)).toBe(1);
  });

  it("is 0 when the last session is older than a week", () => {
    expect(streakWeeks([weeksAgo(2)], weekStart)).toBe(0);
  });
});
