import { Directory, File, Paths } from "expo-file-system";
import { Image, type ImageRef } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { createVideoPlayer, type VideoThumbnail } from "expo-video";
import { MediaType } from "@/lib/enums";

export type PickedMedia = { uri: string; type: MediaType };

const MAX_PX = 1080;
const JPEG_QUALITY = 0.8;

const mediaDir = () => new Directory(Paths.document, "media");

// Fresh picks are file:// URIs, DB rows hold bare filenames so they survive
// iOS app-container path changes across updates.
export function isStoredName(path: string) {
  return !path.includes("://");
}

export function mediaUri(name: string) {
  return new File(mediaDir(), name).uri;
}

export function posterName(name: string) {
  return `${name}.jpg`;
}

export async function pickMedia(): Promise<PickedMedia | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;
  return { uri: asset.uri, type: assetType(asset) };
}

function assetType(asset: ImagePicker.ImagePickerAsset): MediaType {
  if (asset.type === "video") return MediaType.Video;
  if (
    asset.mimeType === "image/gif" ||
    /\.gif$/i.test(asset.fileName ?? asset.uri)
  )
    return MediaType.Gif;
  return MediaType.Photo;
}

export async function persistMedia(tempUri: string, type: MediaType | null) {
  const dir = mediaDir();
  if (!dir.exists) dir.create();
  const stamp = `media-${Date.now()}`;
  if (type === MediaType.Photo) {
    const image = await Image.loadAsync(tempUri, {
      maxWidth: MAX_PX,
      maxHeight: MAX_PX,
    });
    return saveJpeg(image, `${stamp}.jpg`);
  }
  const base = tempUri.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  const name = `${stamp}${dot === -1 ? "" : base.slice(dot)}`;
  await new File(tempUri).copy(new File(dir, name));
  if (type === MediaType.Video) await savePoster(name);
  return name;
}

// Best-effort: a video without a poster only shows a blank thumbnail.
async function savePoster(videoName: string) {
  const player = createVideoPlayer(mediaUri(videoName));
  try {
    const [frame] = await player.generateThumbnailsAsync(0, {
      maxWidth: MAX_PX,
      maxHeight: MAX_PX,
    });
    await saveJpeg(frame, posterName(videoName));
  } catch (error) {
    if (__DEV__) console.error(error);
  } finally {
    player.release();
  }
}

async function saveJpeg(image: ImageRef | VideoThumbnail, name: string) {
  const rendered = await ImageManipulator.manipulate(image).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });
  await new File(saved.uri).move(new File(mediaDir(), name));
  return name;
}

export function clearMediaDir() {
  try {
    const dir = mediaDir();
    if (dir.exists) dir.delete();
  } catch (error) {
    if (__DEV__) console.error(error);
  }
}

// Best-effort: a leaked file must never fail a save.
export function deleteMedia(name: string | null) {
  if (!name) return;
  for (const stored of [name, posterName(name)]) {
    try {
      const file = new File(mediaDir(), stored);
      if (file.exists) file.delete();
    } catch (error) {
      if (__DEV__) console.error(error);
    }
  }
}
