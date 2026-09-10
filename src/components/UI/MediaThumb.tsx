import { useEventListener } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Dimensions, View } from "react-native";
import { MediaType } from "@/lib/enums";
import { isStoredName, mediaUri, posterName } from "@/lib/media";

type Props = {
  path: string | null;
  type: MediaType | null;
  animated?: boolean;
  maxHeight?: number;
  className?: string;
};

type OnSize = (width: number, height: number) => void;

// expo-image / VideoView don't take className, so the wrapper carries layout.
const FILL = { width: "100%", height: "100%" } as const;

export default function MediaThumb({
  path,
  type,
  animated = false,
  maxHeight,
  className = "",
}: Props) {
  const video = type === MediaType.Video;
  // Static video thumbs show the poster saved beside the file instead of allocating a player.
  const uri = path
    ? isStoredName(path)
      ? mediaUri(video && !animated ? posterName(path) : path)
      : path
    : null;
  const [sized, setSized] = useState<{ uri: string; ratio: number } | null>(
    null,
  );
  const [available, setAvailable] = useState(
    () => Dimensions.get("window").width,
  );
  const ratio = sized?.uri === uri ? sized.ratio : 1;
  const onSize: OnSize = (width, height) => {
    if (uri && width > 0 && height > 0)
      setSized({ uri, ratio: width / height });
  };

  const box = (
    <View
      className={`overflow-hidden bg-card2 ${className}`}
      style={
        maxHeight === undefined
          ? undefined
          : {
              width: Math.min(available, maxHeight * ratio),
              aspectRatio: ratio,
            }
      }
    >
      {uri ? (
        video && animated ? (
          <VideoThumb uri={uri} onSize={onSize} />
        ) : (
          <Image
            source={{ uri }}
            contentFit="cover"
            style={FILL}
            autoplay={animated}
            onLoad={(e) => onSize(e.source.width, e.source.height)}
          />
        )
      ) : null}
    </View>
  );

  if (maxHeight === undefined) return box;
  return (
    <View
      className="w-full items-center"
      onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}
    >
      {box}
    </View>
  );
}

type MediaProps = { uri: string; onSize: OnSize };

// Split out so a native player is only allocated for actual videos.
function VideoThumb({ uri, onSize }: MediaProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.audioMixingMode = "mixWithOthers";
    p.play();
  });
  useEventListener(player, "videoTrackChange", ({ videoTrack }) => {
    if (videoTrack) onSize(videoTrack.size.width, videoTrack.size.height);
  });
  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      style={FILL}
    />
  );
}
