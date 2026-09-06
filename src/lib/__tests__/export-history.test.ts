import { shareAsync } from "expo-sharing";
import { getHistoryRows } from "@/db/queries/history";
import { exportHistory } from "@/lib/export-history";

jest.mock("expo-file-system");
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn(() => Promise.resolve()) }));
jest.mock("@/db/queries/history", () => ({ getHistoryRows: jest.fn() }));

const { fakeFs } =
  jest.requireMock<typeof import("@/__mocks__/expo-file-system")>("expo-file-system");

beforeEach(() => {
  fakeFs.reset();
  jest.useFakeTimers({ now: new Date(2026, 8, 9, 12) });
});
afterEach(() => jest.useRealTimers());

describe("exportHistory", () => {
  it("does nothing without history", async () => {
    jest.mocked(getHistoryRows).mockReturnValue([]);
    expect(await exportHistory()).toBe(false);
    expect(shareAsync).not.toHaveBeenCalled();
    expect(fakeFs.entries.size).toBe(0);
  });

  it("writes a dated CSV with ISO timestamps to the cache and shares it", async () => {
    jest.mocked(getHistoryRows).mockReturnValue([
      {
        sessionId: 1,
        routine: "Push Day",
        startedAt: 0,
        endedAt: 60_000,
        exercise: "Bench Press",
        measuredBy: "reps",
        setNumber: 1,
        reps: 8,
        timeSec: null,
        weightKg: 60,
        note: null,
        skipped: false,
        completedAt: 30_000,
      },
      {
        sessionId: 2,
        routine: "Legs",
        startedAt: 120_000,
        endedAt: null,
        exercise: null,
        measuredBy: null,
        setNumber: null,
        reps: null,
        timeSec: null,
        weightKg: null,
        note: null,
        skipped: null,
        completedAt: null,
      },
    ]);

    expect(await exportHistory()).toBe(true);

    const uri = "file:///cache/volt-history-2026-09-09.csv";
    const [header, row, empty, ...rest] = (fakeFs.entries.get(uri) ?? "").split(/\r?\n/);
    expect(header).toBe(
      "session_id,routine,started_at,ended_at,exercise,measured_by,set_number,reps,time_sec,weight_kg,note,skipped,completed_at",
    );
    expect(row).toContain("Push Day");
    expect(row).toContain("1970-01-01T00:00:00.000Z");
    expect(row).toContain("1970-01-01T00:01:00.000Z");
    expect(row).toContain("1970-01-01T00:00:30.000Z");
    expect(empty).toBe("2,Legs,1970-01-01T00:02:00.000Z,,,,,,,,,,");
    expect(rest.filter(Boolean)).toHaveLength(0);
    expect(shareAsync).toHaveBeenCalledWith(uri, expect.objectContaining({ mimeType: "text/csv" }));
  });
});
