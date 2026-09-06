import {
  archiveExercise,
  EMPTY_EXERCISE,
  exerciseFormSchema,
  insertExercise,
  unarchiveExercise,
  updateExercise,
  useArchivedExercises,
  useExercise,
  useExercises,
} from "@/db/queries/exercises";
import { deleteMedia, persistMedia } from "@/lib/media";

jest.mock("@/db/client");
jest.mock("drizzle-orm/expo-sqlite");
jest.mock("@/lib/media", () => ({
  isStoredName: (path: string) => !path.includes("://"),
  persistMedia: jest.fn((uri: string) => `stored-${uri.split("/").pop()}`),
  deleteMedia: jest.fn(),
}));

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");

beforeEach(resetDb);

describe("exerciseFormSchema", () => {
  it("requires a non-blank name of at most 100 characters", () => {
    expect(() => exerciseFormSchema.parse({ ...EMPTY_EXERCISE, name: "  " })).toThrow(
      /required/,
    );
    expect(() =>
      exerciseFormSchema.parse({ ...EMPTY_EXERCISE, name: "x".repeat(101) }),
    ).toThrow(/100/);
  });
});

describe("insertExercise", () => {
  it("trims the name and stores empty notes and media as null", async () => {
    const row = await insertExercise({
      ...EMPTY_EXERCISE,
      name: "  Bench Press ",
      mediaType: "photo",
    });
    expect(row).toMatchObject({
      name: "Bench Press",
      notes: null,
      mediaPath: null,
      mediaType: null,
      archivedAt: null,
    });
    expect(persistMedia).not.toHaveBeenCalled();
  });

  it("copies a fresh pick into the media dir and keeps a stored name as is", async () => {
    const fresh = await insertExercise({
      ...EMPTY_EXERCISE,
      name: "Curl",
      mediaPath: "file:///tmp/pick.gif",
      mediaType: "gif",
    });
    expect(persistMedia).toHaveBeenCalledWith("file:///tmp/pick.gif");
    expect(fresh).toMatchObject({ mediaPath: "stored-pick.gif", mediaType: "gif" });

    const stored = await insertExercise({
      ...EMPTY_EXERCISE,
      name: "Row",
      mediaPath: "media-1.jpg",
      mediaType: "photo",
    });
    expect(persistMedia).toHaveBeenCalledTimes(1);
    expect(stored.mediaPath).toBe("media-1.jpg");
  });
});

describe("media cleanup on failure", () => {
  const fresh = { ...EMPTY_EXERCISE, name: "Curl", mediaPath: "file:///tmp/pick.jpg", mediaType: "photo" as const };

  it("removes the copied file when the insert fails", async () => {
    const insert = jest.spyOn(db, "insert").mockImplementation(() => {
      throw new Error("disk full");
    });
    await expect(insertExercise(fresh)).rejects.toThrow("disk full");
    expect(deleteMedia).toHaveBeenCalledWith("stored-pick.jpg");
    insert.mockRestore();
  });

  it("leaves stored media alone when a write fails", async () => {
    const stored = { ...EMPTY_EXERCISE, name: "Curl", mediaPath: "media-1.jpg", mediaType: "photo" as const };
    const insert = jest.spyOn(db, "insert").mockImplementation(() => {
      throw new Error("disk full");
    });
    await expect(insertExercise(stored)).rejects.toThrow();
    insert.mockRestore();

    const row = await insertExercise(stored);
    const update = jest.spyOn(db, "update").mockImplementation(() => {
      throw new Error("disk full");
    });
    await expect(updateExercise(row.id, stored)).rejects.toThrow();
    update.mockRestore();
    expect(deleteMedia).not.toHaveBeenCalled();
  });

  it("removes the copied file when the update fails", async () => {
    const row = await insertExercise({ ...EMPTY_EXERCISE, name: "Curl" });
    const update = jest.spyOn(db, "update").mockImplementation(() => {
      throw new Error("disk full");
    });
    await expect(updateExercise(row.id, fresh)).rejects.toThrow("disk full");
    expect(deleteMedia).toHaveBeenCalledWith("stored-pick.jpg");
    update.mockRestore();
  });
});

describe("updateExercise", () => {
  const withMedia = () =>
    insertExercise({
      ...EMPTY_EXERCISE,
      name: "Squat",
      mediaPath: "old.jpg",
      mediaType: "photo",
    });

  it("deletes the previous media when it changes or is removed", async () => {
    const a = await withMedia();
    await updateExercise(a.id, { ...EMPTY_EXERCISE, name: "Squat", mediaPath: "new.jpg", mediaType: "photo" });
    expect(deleteMedia).toHaveBeenCalledWith("old.jpg");
    expect(useExercise(a.id)?.mediaPath).toBe("new.jpg");

    const b = await withMedia();
    await updateExercise(b.id, { ...EMPTY_EXERCISE, name: "Squat" });
    expect(deleteMedia).toHaveBeenCalledTimes(2);
    expect(useExercise(b.id)).toMatchObject({ mediaPath: null, mediaType: null });
  });

  it("keeps the media when the stored name is unchanged", async () => {
    const row = await withMedia();
    await updateExercise(row.id, { ...EMPTY_EXERCISE, name: "Front Squat", mediaPath: "old.jpg", mediaType: "photo" });
    expect(deleteMedia).not.toHaveBeenCalled();
    expect(useExercise(row.id)).toMatchObject({ name: "Front Squat", mediaPath: "old.jpg" });
  });
});

describe("archive", () => {
  it("moves exercises between the library and archived lists", async () => {
    const zed = await insertExercise({ ...EMPTY_EXERCISE, name: "Zed" });
    const abs = await insertExercise({ ...EMPTY_EXERCISE, name: "Abs" });
    expect(useExercises().map((e) => e.name)).toEqual(["Abs", "Zed"]);

    await archiveExercise(zed.id);
    expect(useExercises().map((e) => e.name)).toEqual(["Abs"]);
    expect(useArchivedExercises().map((e) => e.name)).toEqual(["Zed"]);
    expect(useExercise(zed.id)?.archivedAt).toEqual(expect.any(Number));

    await unarchiveExercise(zed.id);
    expect(useArchivedExercises()).toHaveLength(0);
    expect(useExercises().map((e) => e.id)).toEqual([abs.id, zed.id]);
  });

  it("returns undefined for an unknown id", () => {
    expect(useExercise(999)).toBeUndefined();
  });
});
