import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RoutineDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-bg px-5" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-2xl text-text">Routine {id}</Text>
    </View>
  );
}
