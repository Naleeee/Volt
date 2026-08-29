import { View, Text } from "react-native";
import { formatDuration } from "@/lib/format";

type Props = { workouts: number; trainedSec: number; setsLogged: number };

export default function RoutinesStatsPill({ workouts, trainedSec, setsLogged }: Props) {
  return (
    <View className="flex-row items-center justify-between bg-card rounded-3xl p-4 border border-muted/30">
      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">{workouts}</Text>
        <Text className="font-archivo-bold text-xs text-muted">workouts this week</Text>
      </View>

      <View className="border-l border-muted/30 h-14 mx-2" />

      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">{formatDuration(trainedSec)}</Text>
        <Text className="font-archivo-bold text-xs text-muted">
          time trained
        </Text>
      </View>

      <View className="border-l border-muted/30 h-14 mx-2" />

      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">{setsLogged}</Text>
        <Text className="font-archivo-bold text-xs text-muted">sets logged</Text>
      </View>
    </View>
  );
}
