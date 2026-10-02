import { Directory, File } from "expo-file-system";
import { Image, type ImageRef } from "expo-image";
import {
  ImageManipulator,
  type ImageManipulatorContext,
} from "expo-image-manipulator";
import { launchImageLibraryAsync, type ImagePickerAsset } from "expo-image-picker";
import { createVideoPlayer, type VideoPlayer } from "expo-video";
import { MediaType } from "@/lib/enums";
import {
  clearMediaDir,
  deleteMedia,
  hasPoster,
  isStoredName,
  mediaUri,
  persistMedia,
  pickMedia,
  posterName,
} from "@/lib/media";

jest.mock("expo-file-system");
jest.mock("expo-image", () => ({ Image: { loadAsync: jest.fn() } }));
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: { manipulate: jest.fn() },
}));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("expo-video", () => ({ createVideoPlayer: jest.fn() }));

const { fakeFs } =
  jest.requireMock<typeof import("@/__mocks__/expo-file-system")>("expo-file-system");
const MEDIA = "file:///document/media";
const NOW = 1_700_000_000_000;
// The manipulator saves into the cache dir; persistMedia moves the result into place.
const RENDERED = "file:///cache/rendered.jpg";
const MAX = { maxWidth: 1080, maxHeight: 1080 };

beforeEach(() => {
  fakeFs.reset();
  jest.useFakeTimers({ now: NOW });
  jest.mocked(ImageManipulator.manipulate).mockReturnValue({
    renderAsync: async () => ({
      saveAsync: async () => {
        fakeFs.entries.set(RENDERED, "jpeg");
        return { uri: RENDERED, width: 1, height: 1 };
      },
    }),
  } as unknown as ImageManipulatorContext);
});
afterEach(() => jest.useRealTimers());

const fakePlayer = (thumbs: Promise<unknown>) => {
  const player = {
    generateThumbnailsAsync: jest.fn().mockReturnValue(thumbs),
    release: jest.fn(),
  };
  jest.mocked(createVideoPlayer).mockReturnValue(player as unknown as VideoPlayer);
  return player;
};

describe("stored names", () => {
  it("tells bare filenames from picker URIs", () => {
    expect(isStoredName("media-1.jpg")).toBe(true);
    expect(isStoredName("file:///tmp/a.jpg")).toBe(false);
    expect(isStoredName("content://media/1")).toBe(false);
  });

  it("resolves a stored name inside the media dir", () => {
    expect(mediaUri("a.jpg")).toBe(`${MEDIA}/a.jpg`);
  });

  it("derives a video's poster name from its own", () => {
    expect(posterName("clip.mp4")).toBe("clip.mp4.jpg");
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
  it("downscales a photo and stores it as a JPEG", async () => {
    const photo = {} as ImageRef;
    jest.mocked(Image.loadAsync).mockResolvedValue(photo);
    await expect(persistMedia("file:///tmp/pick.HEIC", MediaType.Photo)).resolves.toBe(
      `media-${NOW}.jpg`,
    );
    expect(Image.loadAsync).toHaveBeenCalledWith("file:///tmp/pick.HEIC", MAX);
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith(photo);
    expect(fakeFs.entries.get(MEDIA)).toBeNull();
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.jpg`)).toBe("jpeg");
    expect(fakeFs.entries.has(RENDERED)).toBe(false);
  });

  it("copies a GIF untouched and saves a poster frame beside it", async () => {
    fakeFs.entries.set("file:///tmp/loop.GIF", "bytes");
    await expect(persistMedia("file:///tmp/loop.GIF", MediaType.Gif)).resolves.toBe(
      `media-${NOW}.GIF`,
    );
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.GIF`)).toBe("bytes");
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith(`${MEDIA}/media-${NOW}.GIF`);
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.GIF.jpg`)).toBe("jpeg");
    expect(hasPoster(`media-${NOW}.GIF`)).toBe(true);
    expect(Image.loadAsync).not.toHaveBeenCalled();
    expect(createVideoPlayer).not.toHaveBeenCalled();
  });

  it("keeps the GIF when its poster cannot be generated", async () => {
    jest.mocked(ImageManipulator.manipulate).mockImplementation(() => {
      throw new Error("no bitmap");
    });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    fakeFs.entries.set("file:///tmp/loop.gif", "bytes");
    await expect(persistMedia("file:///tmp/loop.gif", MediaType.Gif)).resolves.toBe(
      `media-${NOW}.gif`,
    );
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.gif`)).toBe("bytes");
    expect(hasPoster(`media-${NOW}.gif`)).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.any(Error));
    error.mockRestore();
  });

  it("copes with a pick that has no extension and reuses an existing dir", async () => {
    fakeFs.entries.set(MEDIA, null);
    fakeFs.entries.set(`${MEDIA}/keep.jpg`, "");
    fakeFs.entries.set("file:///tmp/blob", "");
    await expect(persistMedia("file:///tmp/blob", null)).resolves.toBe(`media-${NOW}`);
    expect(fakeFs.entries.has(`${MEDIA}/keep.jpg`)).toBe(true);
  });

  it("copies a video and saves a poster frame beside it", async () => {
    const frame = {};
    const player = fakePlayer(Promise.resolve([frame]));
    fakeFs.entries.set("file:///tmp/clip.mp4", "video");
    await expect(persistMedia("file:///tmp/clip.mp4", MediaType.Video)).resolves.toBe(
      `media-${NOW}.mp4`,
    );
    expect(createVideoPlayer).toHaveBeenCalledWith(`${MEDIA}/media-${NOW}.mp4`);
    expect(player.generateThumbnailsAsync).toHaveBeenCalledWith(0, MAX);
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith(frame);
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.mp4`)).toBe("video");
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.mp4.jpg`)).toBe("jpeg");
    expect(player.release).toHaveBeenCalledTimes(1);
  });

  it("keeps the video when the poster cannot be generated", async () => {
    const player = fakePlayer(Promise.reject(new Error("no frames")));
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    fakeFs.entries.set("file:///tmp/clip.mp4", "video");
    await expect(persistMedia("file:///tmp/clip.mp4", MediaType.Video)).resolves.toBe(
      `media-${NOW}.mp4`,
    );
    expect(fakeFs.entries.get(`${MEDIA}/media-${NOW}.mp4`)).toBe("video");
    expect(fakeFs.entries.has(`${MEDIA}/media-${NOW}.mp4.jpg`)).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.any(Error));
    expect(player.release).toHaveBeenCalledTimes(1);
    error.mockRestore();
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

  it("removes a video's poster along with it", () => {
    fakeFs.entries.set(`${MEDIA}/clip.mp4`, "");
    fakeFs.entries.set(`${MEDIA}/clip.mp4.jpg`, "");
    deleteMedia("clip.mp4");
    expect(fakeFs.entries.size).toBe(0);
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
