import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { colors } from "@/constants/theme";

const SIZES = {
  sm: { box: "w-9 h-9", icon: 14 },
  md: { box: "w-11 h-11", icon: 18 },
  lg: { box: "w-16 h-16", icon: 28 },
} as const;

type Props = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  size?: keyof typeof SIZES;
};

export default function StepButton({
  icon: Icon,
  label,
  onPress,
  size = "md",
}: Props) {
  const s = SIZES[size];
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`${s.box} rounded-full bg-card2 border border-line items-center justify-center active:scale-95 active:opacity-90`}
    >
      <Icon size={s.icon} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}
