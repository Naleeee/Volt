import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "time" | "outline" | "dashed";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<
  Variant,
  { box: string; text: string; color: string; textSize?: string }
> = {
  primary: {
    box: "bg-accent rounded-full",
    text: "text-accent-ink",
    color: colors["accent-ink"],
  },
  secondary: {
    box: "bg-card2 border border-line rounded-full",
    text: "text-text",
    color: colors.text,
  },
  time: {
    box: "bg-time rounded-full",
    text: "text-time-ink",
    color: colors["time-ink"],
  },
  outline: {
    box: "border-[1.5px] border-accent rounded-full",
    text: "text-accent",
    color: colors.accent,
  },
  dashed: {
    box: "border-[1.5px] border-dashed border-white/[0.18] rounded-2xl",
    text: "text-muted",
    color: colors.muted,
    textSize: "text-sm",
  },
};

const SIZES: Record<Size, { box: string; text: string; icon: number }> = {
  sm: { box: "h-10 px-5 gap-2", text: "text-sm", icon: 14 },
  md: { box: "h-12 px-6 gap-2", text: "text-base", icon: 16 },
  lg: { box: "h-14 px-6 gap-[9px]", text: "text-lg", icon: 18 },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconFill?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon: Icon,
  iconFill = false,
  loading = false,
  disabled = false,
  accessibilityLabel,
  className = "",
}: Props) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`flex-row items-center justify-center active:opacity-80 ${v.box} ${s.box} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.color} />
      ) : (
        <>
          {Icon ? (
            <Icon
              size={s.icon}
              strokeWidth={2.4}
              color={v.color}
              fill={iconFill ? v.color : undefined}
            />
          ) : null}
          <Text
            className={`font-archivo-bold ${v.textSize ?? s.text} ${v.text}`}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
