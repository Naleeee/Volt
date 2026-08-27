import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/lib/toast";

const DURATION_MS = 3500;

export default function Toast() {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  // Auto-dismiss timer restarts whenever a new toast replaces the current one.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: insets.bottom + 24,
      }}
    >
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        className="flex-row items-center gap-3 bg-card2 border border-line rounded-2xl px-4 py-3"
      >
        <View
          className={`w-2 h-2 rounded-full ${toast.kind === "error" ? "bg-danger" : "bg-accent"}`}
        />
        <Text className="flex-1 font-archivo-semibold text-sm text-text">
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
