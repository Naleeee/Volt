import { Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { formatLastPerformed } from "@/lib/format";

type Props = {
  name: string;
  exerciseCount: number;
  lastPerformedAt: number | null;
  onPress: () => void;
  onStart: () => void;
};

export default function RoutineCard({
  name,
  exerciseCount,
  lastPerformedAt,
  onPress,
  onStart,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 bg-card border border-line rounded-3xl p-4 active:opacity-80"
    >
      <View className="flex-1 gap-1">
        <Text className="font-archivo-bold text-lg text-text">{name}</Text>
        <Text className="font-archivo text-sm text-muted">
          {`${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"} · ${lastPerformedLabel(lastPerformedAt)}`}
        </Text>
      </View>
      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel={`Start ${name}`}
        className="flex-row items-center gap-2 h-10 px-5 rounded-full bg-accent active:opacity-80"
      >
        <Play
          size={14}
          color={colors["accent-ink"]}
          fill={colors["accent-ink"]}
        />
        <Text className="font-archivo-bold text-sm text-accent-ink">Start</Text>
      </Pressable>
    </Pressable>
  );
}

function lastPerformedLabel(ts: number | null) {
  const label = formatLastPerformed(ts);
  return ts == null || label === "Today" ? label : `Last: ${label}`;
}
