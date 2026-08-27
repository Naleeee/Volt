import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
};

export default function FormHeader({ title, onCancel, onSave, saving }: Props) {
  return (
    <View className="flex justify-center items-center flex-row bg-card p-6">
      <Pressable className="w-[60px]" onPress={onCancel} disabled={saving}>
        <Text className="font-archivo text-base text-muted">Cancel</Text>
      </Pressable>
      <Text className="font-archivo-bold text-2xl flex-grow text-center text-text">
        {title}
      </Text>
      <Pressable className="w-[60px] items-end" onPress={onSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text className="font-archivo text-base text-accent">Save</Text>
        )}
      </Pressable>
    </View>
  );
}
