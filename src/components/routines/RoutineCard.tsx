import { Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Button from "@/components/UI/Button";
import { formatLastPerformedLine } from "@/lib/format";

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
          {`${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"} · ${formatLastPerformedLine(lastPerformedAt)}`}
        </Text>
      </View>
      <Button
        label="Start"
        size="sm"
        icon={Play}
        iconFill
        onPress={onStart}
        accessibilityLabel={`Start ${name}`}
      />
    </Pressable>
  );
}
