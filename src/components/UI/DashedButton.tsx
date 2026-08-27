import { Plus } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { colors } from "@/constants/theme";

export default function DashedButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-[54px] flex-row items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-white/[0.18] active:opacity-80"
    >
      <Plus size={18} strokeWidth={2.4} color={colors.muted} />
      <Text className="font-archivo-bold text-sm text-muted">{label}</Text>
    </Pressable>
  );
}
