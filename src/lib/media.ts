import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { MediaType } from "@/lib/enums";

export type PickedMedia = { uri: string; type: MediaType };

const mediaDir = () => new Directory(Paths.document, "media");

// Fresh picks are file:// URIs, DB rows hold bare filenames so they survive
// iOS app-container path changes across updates.
export function isStoredName(path: string) {
  return !path.includes("://");
}

export function mediaUri(name: string) {
  return new File(mediaDir(), name).uri;
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

// Copies a picked temp file into the media dir, returns the stored filename.
export function persistMedia(tempUri: string) {
  const dir = mediaDir();
  if (!dir.exists) dir.create();
  const base = tempUri.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  const name = `media-${Date.now()}${dot === -1 ? "" : base.slice(dot)}`;
  new File(tempUri).copySync(new File(dir, name));
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
  try {
    const file = new File(mediaDir(), name);
    if (file.exists) file.delete();
  } catch (error) {
    if (__DEV__) console.error(error);
  }
}
