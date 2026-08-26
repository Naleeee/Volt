import {
  format,
  isToday,
  isYesterday,
  differenceInCalendarDays,
} from "date-fns";
export function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
export function formatWeight(kg: number) {
  return `${kg} kg`;
}

export function formatLastPerformed(ts: number | null) {
  if (ts == null) return "Never";
  if (isToday(ts)) return "Today";
  if (isYesterday(ts)) return "Yesterday";
  const daysAgo = differenceInCalendarDays(Date.now(), ts);
  if (daysAgo >= 0 && daysAgo < 7) return format(ts, "EEEE");
  return format(ts, "d MMM");
}
