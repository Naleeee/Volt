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

// "~45 min" / "~1 h 15 min", rounded to the nearest 5 minutes.
export function formatEstimatedDuration(totalSec: number) {
  const minutes = Math.max(5, Math.round(totalSec / 60 / 5) * 5);
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${String(m).padStart(2, "0")} min`;
}

// "Last: Tue" / "Today" / "Never" — the routine-card and detail subtitle form.
export function formatLastPerformedLine(ts: number | null) {
  const label = formatLastPerformed(ts);
  return ts == null || label === "Today" ? label : `Last: ${label}`;
}

// "3h 12m" · "45m" · "0m" — whole minutes, for totals rather than clocks.
export function formatDuration(totalSec: number) {
  const minutes = Math.round(totalSec / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
