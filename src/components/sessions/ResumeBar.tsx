import { Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Button from "@/components/UI/Button";
import type { ActiveSession } from "@/db/queries/sessions";
import { formatClock } from "@/lib/format";

type Props = {
  session: ActiveSession;
  onResume: () => void;
  onDiscard: () => void;
};

export default function ResumeBar({ session, onResume, onDiscard }: Props) {
  const pausedAtSec = Math.floor(
    ((session.lastSetAt ?? session.startedAt) - session.startedAt) / 1000,
  );
  const progress =
    session.plannedSets > 0 ? session.loggedSets / session.plannedSets : 0;

  return (
    <View className="bg-card border-2 border-accent rounded-3xl p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-archivo-bold text-xs tracking-widest text-accent">
            IN PROGRESS
          </Text>
          <Text className="font-archivo-bold text-lg text-text mt-1">
            {session.routineName}
          </Text>
          <Text className="font-archivo text-sm text-muted mt-1">
            Paused at {formatClock(pausedAtSec)} · {session.loggedSets} of{" "}
            {session.plannedSets} sets
          </Text>
        </View>
        <Button
          label="Resume"
          size="sm"
          icon={Play}
          iconFill
          onPress={onResume}
          accessibilityLabel={`Resume ${session.routineName}`}
        />
      </View>
      <View className="h-2 rounded-md bg-white/10 mt-3 overflow-hidden">
        <View
          className="h-full bg-accent"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
      <Pressable
        onPress={onDiscard}
        accessibilityRole="button"
        hitSlop={8}
        className="mt-2.5 active:opacity-80"
      >
        <Text className="font-archivo-bold text-xs text-muted text-center">
          Discard session
        </Text>
      </Pressable>
    </View>
  );
}
