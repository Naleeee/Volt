import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Fixed action bar pinned over the screen's scrolling content.
export default function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute left-0 right-0 bottom-0 px-5 pt-4 bg-bg"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {children}
    </View>
  );
}
