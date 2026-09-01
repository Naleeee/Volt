import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  className?: string;
  topOffset?: number;
};

// Shared page container: full-height app background padded below the status bar.
export default function Screen({
  children,
  className = "",
  topOffset = 24,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-bg px-4 gap-4 ${className}`}
      style={{ paddingTop: insets.top + topOffset }}
    >
      {children}
    </View>
  );
}
