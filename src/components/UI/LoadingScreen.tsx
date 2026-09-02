import { ActivityIndicator, View } from "react-native";
import { colors } from "@/constants/theme";

export default function LoadingScreen() {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
