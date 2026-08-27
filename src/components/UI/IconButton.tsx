import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  className?: string;
};

export default function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  className = "",
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`w-14 h-14 rounded-full bg-accent items-center justify-center active:opacity-80 ${className}`}
      style={{
        elevation: 8,
        shadowColor: colors.accent,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Icon size={22} strokeWidth={2.6} color={colors["accent-ink"]} />
    </Pressable>
  );
}
