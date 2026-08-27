import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewRoutine() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg px-5" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-2xl text-text">Routine builder</Text>
    </View>
  );
}
