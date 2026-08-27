import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RoutineDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-bg px-5 gap-4" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-2xl text-text">Routine {id}</Text>
      <Pressable
        onPress={() => router.push({ pathname: "/routine/[id]/edit", params: { id } })}
        className="self-start rounded-full bg-card2 border border-line px-4 py-2 active:opacity-80"
      >
        <Text className="font-archivo-bold text-sm text-accent">Edit routine</Text>
      </Pressable>
    </View>
  );
}
