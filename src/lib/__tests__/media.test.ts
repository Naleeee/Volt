import { Directory, File } from "expo-file-system";
import { launchImageLibraryAsync, type ImagePickerAsset } from "expo-image-picker";
import {
  clearMediaDir,
  deleteMedia,
  isStoredName,
  mediaUri,
  persistMedia,
  pickMedia,
} from "@/lib/media";

jest.mock("expo-file-system");
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));

const { fakeFs } =
  jest.requireMock<typeof import("@/__mocks__/expo-file-system")>("expo-file-system");
const MEDIA = "file:///document/media";
const NOW = 1_700_000_000_000;

beforeEach(() => {
  fakeFs.reset();
  jest.useFakeTimers({ now: NOW });
});
afterEach(() => jest.useRealTimers());

describe("stored names", () => {
  it("tells bare filenames from picker URIs", () => {
    expect(isStoredName("media-1.jpg")).toBe(true);
    expect(isStoredName("file:///tmp/a.jpg")).toBe(false);
    expect(isStoredName("content://media/1")).toBe(false);
  });

  it("resolves a stored name inside the media dir", () => {
    expect(mediaUri("a.jpg")).toBe(`${MEDIA}/a.jpg`);
  });
});

describe("pickMedia", () => {
  const picked = (asset: Partial<ImagePickerAsset>) =>
    jest.mocked(launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/a.jpg", width: 1, height: 1, ...asset }],
    });

  it("returns null when cancelled or empty", async () => {
    jest.mocked(launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
    expect(await pickMedia()).toBeNull();
    jest.mocked(launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [] });
    expect(await pickMedia()).toBeNull();
  });

  it("classifies videos, gifs by mime type or extension, and photos", async () => {
    picked({ type: "video", uri: "file:///tmp/clip.mp4" });
    expect(await pickMedia()).toEqual({ uri: "file:///tmp/clip.mp4", type: "video" });

    picked({ mimeType: "image/gif" });
    expect((await pickMedia())?.type).toBe("gif");

    picked({ fileName: "loop.GIF" });
    expect((await pickMedia())?.type).toBe("gif");

    picked({ uri: "file:///tmp/loop.gif" });
    expect((await pickMedia())?.type).toBe("gif");

    picked({ mimeType: "image/jpeg" });
    expect((await pickMedia())?.type).toBe("photo");
  });
});

describe("persistMedia", () => {
  it("creates the media dir and copies the pick under a timestamped name", () => {
    fakeFs.entries.set("file:///tmp/pick.JPG", "bytes");
    expect(persistMedia("file:///tmp/pick.JPG")).toBe(`media-${NOW}.JPG`);
    expect(fakeFs.entries.get(MEDIA)).toBeNull();
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.JPG`)).toBe("bytes");
  });

  it("copes with a pick that has no extension and reuses an existing dir", () => {
    fakeFs.entries.set(MEDIA, null);
    fakeFs.entries.set(`${MEDIA}/keep.jpg`, "");
    fakeFs.entries.set("file:///tmp/blob", "");
    expect(persistMedia("file:///tmp/blob")).toBe(`media-${NOW}`);
    expect(fakeFs.entries.has(`${MEDIA}/keep.jpg`)).toBe(true);
  });
});

describe("deleteMedia", () => {
  it("removes an existing file and ignores null or missing names", () => {
    fakeFs.entries.set(`${MEDIA}/a.jpg`, "");
    deleteMedia("a.jpg");
    expect(fakeFs.entries.has(`${MEDIA}/a.jpg`)).toBe(false);
    expect(() => deleteMedia(null)).not.toThrow();
    expect(() => deleteMedia("missing.jpg")).not.toThrow();
  });

  it("never throws, even when the file system does", () => {
    fakeFs.entries.set(`${MEDIA}/locked.jpg`, "");
    const remove = jest.spyOn(File.prototype, "delete").mockImplementation(() => {
      throw new Error("locked");
    });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => deleteMedia("locked.jpg")).not.toThrow();
    expect(error).toHaveBeenCalledWith(expect.any(Error));
    remove.mockRestore();
    error.mockRestore();
  });
});

describe("clearMediaDir", () => {
  it("removes the dir and everything in it", () => {
    fakeFs.entries.set(MEDIA, null);
    fakeFs.entries.set(`${MEDIA}/a.jpg`, "");
    clearMediaDir();
    expect(fakeFs.entries.size).toBe(0);
    expect(() => clearMediaDir()).not.toThrow();
  });

  it("never throws, even when the file system does", () => {
    fakeFs.entries.set(MEDIA, null);
    const remove = jest.spyOn(Directory.prototype, "delete").mockImplementation(() => {
      throw new Error("busy");
    });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => clearMediaDir()).not.toThrow();
    expect(error).toHaveBeenCalledWith(expect.any(Error));
    remove.mockRestore();
    error.mockRestore();
  });
});
