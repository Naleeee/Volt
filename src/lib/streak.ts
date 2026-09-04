import { startOfWeek, subWeeks } from "date-fns";

export const WEEK = { weekStartsOn: 1 as const }; // Monday, local time

// Consecutive weeks with ≥1 completed session, counted back from this week — or from last week
// while this one is still empty, so a streak isn't lost on Monday morning.
export function streakWeeks(sessionStarts: number[], weekStart: number) {
  const weeks = new Set(
    sessionStarts.map((t) => startOfWeek(t, WEEK).getTime()),
  );
  let cursor = weeks.has(weekStart)
    ? weekStart
    : subWeeks(weekStart, 1).getTime();
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor = subWeeks(cursor, 1).getTime();
  }
  return streak;
}
