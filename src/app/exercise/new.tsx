import VTextInput from "@/components/TextInput";
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewExercice() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex justify-center items-center flex-row bg-card p-6">
        <Pressable>
          <Text className="font-archivo text-md text-muted">Cancel</Text>
        </Pressable>
        <Text className="font-archivo-bold text-2xl flex-grow text-center text-text">
          New Exercice
        </Text>
        <Pressable>
          <Text className="font-archivo text-md text-accent">Save</Text>
        </Pressable>
      </View>
      <View className="flex-1 px-5 pt-6 gap-[22px]">
        <VTextInput
          value={name}
          onChangeText={setName}
          placeholder="Exercice name"
          label="Name"
        />
        <Text className="font-archivo-bold text-3xl px-4 text-text">
          Exercice form
        </Text>
      </View>
    </View>
  );
}
