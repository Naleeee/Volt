import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-3xl px-4 text-text">
        Exercices
      </Text>
      <Pressable
        className="bg-accent rounded-lg p-4 m-4"
        onPress={() => {
          router.push("/exercise/new");
        }}
      >
        <Text className="text-text-inverted font-archivo-bold text-lg">
          New Exercice
        </Text>
      </Pressable>
    </View>
  );
}
