import { setSetting, useSettings } from "@/db/queries/settings";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();
  const settings = useSettings();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-3xl px-4 text-text">
        Settings
      </Text>
      <Pressable onPress={() => setSetting("keepAwake", !settings.keepAwake)}>
        <Text className="text-text px-4 py-2">Toggle awake</Text>
      </Pressable>

      <Text className="text-text px-4 py-2">
        Current awake status: {settings.keepAwake ? "true" : "false"}
      </Text>
    </View>
  );
}
