import { Pressable, Text, View } from "react-native";
import { formatClock } from "@/lib/format";

export default function RestBar({ remainingSec, onSkip }: { remainingSec: number; onSkip: () => void }) {
  return (
    <View className="flex-row items-center justify-between h-[52px] rounded-full bg-card2 border border-line pl-[22px] pr-2">
      <Text className="font-archivo-bold text-sm text-text">
        Rest{" "}
        <Text className="text-accent" style={{ fontVariant: ["tabular-nums"] }}>
          {formatClock(remainingSec)}
        </Text>
      </Text>
      <Pressable
        onPress={onSkip}
        accessibilityRole="button"
        className="h-[38px] px-4 rounded-full bg-accent items-center justify-center active:opacity-80"
      >
        <Text className="font-archivo-bold text-[13px] text-accent-ink">Skip</Text>
      </Pressable>
    </View>
  );
}
