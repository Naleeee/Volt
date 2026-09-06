import { settings } from "@/db/schema";
import {
  DEFAULTS,
  getSettings,
  setSetting,
  useSettings,
} from "@/db/queries/settings";

jest.mock("@/db/client");
jest.mock("drizzle-orm/expo-sqlite");

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");
const { live } =
  jest.requireMock<typeof import("@/__mocks__/drizzle-orm/expo-sqlite")>("drizzle-orm/expo-sqlite");

beforeEach(resetDb);
afterEach(() => {
  live.loading = false;
});

describe("getSettings", () => {
  it("returns the defaults on an empty table", async () => {
    expect(await getSettings()).toEqual(DEFAULTS);
  });

  it("merges stored values over the defaults", async () => {
    await setSetting("restBetweenSetsSec", 60);
    await setSetting("timerSounds", false);
    expect(await getSettings()).toEqual({
      ...DEFAULTS,
      restBetweenSetsSec: 60,
      timerSounds: false,
    });
  });

  it("ignores unknown keys, invalid JSON and out-of-range values", async () => {
    db.insert(settings)
      .values([
        { key: "theme", value: '"oled"' },
        { key: "keepAwake", value: "{not json" },
        { key: "restBetweenExercisesSec", value: "2" },
      ])
      .run();
    expect(await getSettings()).toEqual(DEFAULTS);
  });
});

describe("setSetting", () => {
  it("overwrites an existing key", async () => {
    await setSetting("autostartRestTimer", false);
    await setSetting("autostartRestTimer", true);
    expect(db.select().from(settings).all()).toEqual([
      { key: "autostartRestTimer", value: "true" },
    ]);
  });

  it("rejects values outside the schema", async () => {
    await expect(setSetting("restBetweenSetsSec", 3)).rejects.toThrow();
    expect(db.select().from(settings).all()).toHaveLength(0);
  });
});

describe("useSettings", () => {
  it("reads the same merged view", async () => {
    await setSetting("keepAwake", false);
    expect(useSettings()).toEqual({ ...DEFAULTS, keepAwake: false });
  });

  it("falls back to the defaults while loading", () => {
    live.loading = true;
    expect(useSettings()).toEqual(DEFAULTS);
  });
});
