import {
  formatClock,
  formatDuration,
  formatEstimatedDuration,
  formatLastPerformed,
  formatLastPerformedLine,
  formatWeight,
} from "@/lib/format";

describe("formatClock", () => {
  it("formats m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(600)).toBe("10:00");
  });
});

describe("formatWeight", () => {
  it("appends kg", () => {
    expect(formatWeight(62.5)).toBe("62.5 kg");
  });
});

describe("formatEstimatedDuration", () => {
  it("rounds to 5 minutes with a 5 minute floor", () => {
    expect(formatEstimatedDuration(60)).toBe("~5 min");
    expect(formatEstimatedDuration(33 * 60)).toBe("~35 min");
  });

  it("switches to hours at 60 minutes", () => {
    expect(formatEstimatedDuration(3600)).toBe("~1 h");
    expect(formatEstimatedDuration(3900)).toBe("~1 h 05 min");
  });
});

describe("formatDuration", () => {
  it("formats whole minutes and hours", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(90)).toBe("2m");
    expect(formatDuration(59 * 60)).toBe("59m");
    expect(formatDuration(62 * 60)).toBe("1h 02m");
  });
});

describe("formatLastPerformed", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 2, 12)); // Wed 2 Sep 2026
  });
  afterEach(() => jest.useRealTimers());

  const daysAgo = (n: number) => Date.now() - n * 24 * 3600_000;

  it("handles never, today and yesterday", () => {
    expect(formatLastPerformed(null)).toBe("Never");
    expect(formatLastPerformed(Date.now())).toBe("Today");
    expect(formatLastPerformed(daysAgo(1))).toBe("Yesterday");
  });

  it("uses the weekday inside a week, the date beyond", () => {
    expect(formatLastPerformed(daysAgo(3))).toBe("Sunday");
    expect(formatLastPerformed(daysAgo(7))).toBe("26 Aug");
  });

  it("prefixes Last: except for Today and Never", () => {
    expect(formatLastPerformedLine(null)).toBe("Never");
    expect(formatLastPerformedLine(Date.now())).toBe("Today");
    expect(formatLastPerformedLine(daysAgo(1))).toBe("Last: Yesterday");
  });
});
