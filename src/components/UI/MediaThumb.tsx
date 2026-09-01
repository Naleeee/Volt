import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "react-native";
import { MediaType } from "@/lib/enums";
import { isStoredName, mediaUri } from "@/lib/media";

type Props = {
  path: string | null;
  type: MediaType | null;
  className?: string;
};

// expo-image / VideoView don't take className, so the wrapper carries layout.
const FILL = { width: "100%", height: "100%" } as const;

export default function MediaThumb({ path, type, className = "" }: Props) {
  const uri = path ? (isStoredName(path) ? mediaUri(path) : path) : null;
  return (
    <View className={`overflow-hidden bg-card2 ${className}`}>
      {uri ? (
        type === MediaType.Video ? (
          <VideoThumb uri={uri} />
        ) : (
          <Image source={{ uri }} contentFit="cover" style={FILL} />
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
