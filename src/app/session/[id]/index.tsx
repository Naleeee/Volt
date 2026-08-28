import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/UI/Button";
import { colors } from "@/constants/theme";
import {
  allocateLoggedSets,
  finishSession,
  logSet,
  nextPosition,
  useSession,
  useSessionSets,
} from "@/db/queries/sessions";
import { formatClock } from "@/lib/format";
import { useSessionStore } from "@/lib/session-store";
import { useNow } from "@/lib/use-now";

// Session home. Placeholder until the checklist (#15) and focus views (#16–#18) land:
// shows the live clock and progress, and logs the next planned set with its target values.
export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const now = useNow();
  const end = useSessionStore((s) => s.end);

  if (!session) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const done = allocateLoggedSets(session.entries, sets);
  const position = nextPosition(session.entries, done);
  const planned = session.entries.reduce((n, e) => n + e.targetSets, 0);
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));

  const logNext = () => {
    if (!position) return;
    const entry = session.entries[position.exerciseIndex];
    logSet({
      sessionId,
      exerciseId: entry.exerciseId,
      setNumber: position.setNumber,
      reps: entry.targetReps,
      timeSec: entry.targetTimeSec,
      weightKg: entry.targetWeightKg,
    });
  };

  const finish = () => {
    finishSession(sessionId);
    end();
    router.dismissTo("/");
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          className="w-[38px] h-[38px] rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
        >
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>
        <Text className="font-archivo-bold text-[11px] tracking-[1.5px] text-muted">
          {session.routineName.toUpperCase()}
        </Text>
        <Text
          className="font-archivo-bold text-base text-text w-[60px] text-right"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatClock(elapsedSec)}
        </Text>
      </View>
      <Text className="font-archivo text-[13px] text-muted text-center mt-2">
        {sets.length} of {planned} sets
      </Text>
      <FlatList
        data={session.entries}
        keyExtractor={(entry, index) => `${entry.exerciseId}-${index}`}
        contentContainerStyle={{ padding: 20, paddingBottom: 160, gap: 8 }}
        renderItem={({ item, index }) => {
          const complete = done[index] >= item.targetSets;
          const current = position?.exerciseIndex === index;
          return (
            <View
              className={`flex-row items-center gap-3 bg-card border ${current ? "border-accent" : "border-line"} rounded-[18px] px-4 py-3`}
            >
              <Text
                className={`flex-1 font-archivo-bold text-[15px] ${complete ? "text-muted line-through" : "text-text"}`}
              >
                {item.name}
              </Text>
              <Text
                className={`font-archivo-bold text-sm ${complete ? "text-accent" : "text-muted"}`}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {done[index]}/{item.targetSets}
              </Text>
            </View>
          );
        }}
      />
      <View
        className="absolute left-0 right-0 bottom-0 px-5 pt-4 bg-bg gap-2.5"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {position ? (
          <Button
            label={`Log set ${position.setNumber} · ${session.entries[position.exerciseIndex].name}`}
            onPress={logNext}
          />
        ) : null}
        <Button
          variant={position ? "outline" : "primary"}
          label={position ? "Finish early" : "Finish workout"}
          onPress={finish}
        />
      </View>
    </View>
  );
}
