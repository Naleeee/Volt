import { format } from "date-fns";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getHistoryRows } from "@/db/queries/history";
import { toCsv } from "@/lib/csv";

const HEADER = [
  "session_id",
  "routine",
  "started_at",
  "ended_at",
  "exercise",
  "measured_by",
  "set_number",
  "reps",
  "time_sec",
  "weight_kg",
  "note",
  "skipped",
  "completed_at",
];

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());

// Resolves to false when there is no history to export.
export async function exportHistory() {
  const rows = getHistoryRows();
  if (rows.length === 0) return false;

  const csv = toCsv(
    HEADER,
    rows.map((r) => [
      r.sessionId,
      r.routine,
      iso(r.startedAt),
      iso(r.endedAt),
      r.exercise,
      r.measuredBy,
      r.setNumber,
      r.reps,
      r.timeSec,
      r.weightKg,
      r.note,
      r.skipped,
      iso(r.completedAt),
    ]),
  );
  const file = new File(
    Paths.cache,
    `volt-history-${format(Date.now(), "yyyy-MM-dd")}.csv`,
  );
  file.create({ overwrite: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Export history",
    UTI: "public.comma-separated-values-text",
  });
  return true;
}
