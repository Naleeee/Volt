import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: Props) {
  return (
    <View className="flex-1 justify-center items-center gap-4">
      <View className="w-24 h-24 rounded-full bg-card border border-muted/30 justify-center items-center">
        <Icon color={colors.accent} size={32} />
      </View>
      <Text className="font-archivo-bold text-lg text-text">{title}</Text>
      <Text className="font-archivo text-sm text-muted text-center w-2/3 self-center">
        {description}
      </Text>
      {children}
    </View>
  );
}
