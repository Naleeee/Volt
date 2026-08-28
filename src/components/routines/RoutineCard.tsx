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
  inProgress?: boolean;
};

export default function RoutineCard({
  name,
  exerciseCount,
  lastPerformedAt,
  onPress,
  onStart,
  inProgress = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 bg-card border border-line rounded-3xl p-4 active:opacity-80 ${inProgress ? "opacity-50" : ""}`}
    >
      <View className="flex-1 gap-1">
        <Text className="font-archivo-bold text-lg text-text">{name}</Text>
        <Text className="font-archivo text-sm text-muted">
          {`${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"} · ${inProgress ? "In progress" : formatLastPerformedLine(lastPerformedAt)}`}
        </Text>
      </View>
      {inProgress ? null : (
        <Button
          label="Start"
          size="sm"
          icon={Play}
          iconFill
          onPress={onStart}
          accessibilityLabel={`Start ${name}`}
        />
      )}
    </Pressable>
  );
}
