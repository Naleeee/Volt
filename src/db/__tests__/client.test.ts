import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({ execSync: jest.fn() })),
}));
jest.mock("drizzle-orm/expo-sqlite", () => ({ drizzle: jest.fn(() => ({})) }));

describe("db client", () => {
  it("opens volt.db with change events and foreign keys enforced", () => {
    const { db } = jest.requireActual<typeof import("@/db/client")>("@/db/client");

    expect(openDatabaseSync).toHaveBeenCalledWith("volt.db", { enableChangeListener: true });
    const sqlite = jest.mocked(openDatabaseSync).mock.results[0].value;
    expect(sqlite.execSync).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
    expect(drizzle).toHaveBeenCalledWith(
      sqlite,
      { schema: expect.objectContaining({ exercises: expect.anything(), sessions: expect.anything() }) },
    );
    expect(db).toBe(jest.mocked(drizzle).mock.results[0].value);
  });
});
