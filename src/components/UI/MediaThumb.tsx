import { Image } from "expo-image";
import { createVideoPlayer, useVideoPlayer, VideoView } from "expo-video";
import type { VideoThumbnail } from "expo-video";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { MediaType } from "@/lib/enums";
import { isStoredName, mediaUri } from "@/lib/media";

type Props = {
  path: string | null;
  type: MediaType | null;
  animated?: boolean;
  className?: string;
};

// expo-image / VideoView don't take className, so the wrapper carries layout.
const FILL = { width: "100%", height: "100%" } as const;

export default function MediaThumb({
  path,
  type,
  animated = false,
  className = "",
}: Props) {
  const uri = path ? (isStoredName(path) ? mediaUri(path) : path) : null;
  return (
    <View className={`overflow-hidden bg-card2 ${className}`}>
      {uri ? (
        type === MediaType.Video ? (
          animated ? (
            <VideoThumb uri={uri} />
          ) : (
            <VideoStill uri={uri} />
          )
        ) : (
          <Image
            source={{ uri }}
            contentFit="cover"
            style={FILL}
            autoplay={animated}
          />
        )
      ) : null}
    </View>
  );
}

// Split out so a native player is only allocated for actual videos.
function VideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.audioMixingMode = "mixWithOthers";
    p.play();
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

// A throwaway player grabs the first frame so lists never hold live players.
function VideoStill({ uri }: { uri: string }) {
  const [frame, setFrame] = useState<VideoThumbnail | null>(null);
  useEffect(() => {
    let cancelled = false;
    const player = createVideoPlayer(uri);
    player
      .generateThumbnailsAsync(0)
      .then(([thumb]) => {
        if (!cancelled) setFrame(thumb);
      })
      .catch((error) => {
        if (__DEV__) console.error(error);
      })
      .finally(() => player.release());
    return () => {
      cancelled = true;
    };
  }, [uri]);
  return frame ? (
    <Image source={frame} contentFit="cover" style={FILL} />
  ) : null;
}
