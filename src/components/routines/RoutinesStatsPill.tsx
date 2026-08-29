import { View, Text } from "react-native";

// interface RoutinesStatsPillProps {}
export default function RoutinesStatsPill() {
  return (
    <View className="flex-row items-center justify-between bg-card rounded-3xl p-4 border border-muted/30">
      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">4</Text>
        <Text className="font-archivo-bold text-xs text-muted">This week</Text>
      </View>

      <View className="border-l border-muted/30 h-14 mx-2" />

      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">3h 12m</Text>
        <Text className="font-archivo-bold text-xs text-muted">
          time trained
        </Text>
      </View>

      <View className="border-l border-muted/30 h-14 mx-2" />

      <View className="flex-grow justify-center items-center">
        <Text className="font-archivo-bold text-3xl text-text">58</Text>
        <Text className="font-archivo-bold text-xs text-muted">sets logs</Text>
      </View>
    </View>
  );
}
