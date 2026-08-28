import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RestBar from "@/components/sessions/RestBar";
import {
  CollapsedExerciseCard,
  ExpandedExerciseCard,
} from "@/components/sessions/SessionChecklistCard";
import Button from "@/components/UI/Button";
import { colors } from "@/constants/theme";
import {
  deleteSet,
  finishSession,
  groupSetsByEntry,
  useGhostSets,
  logSet,
  nextPosition,
  useSession,
  useSessionSets,
} from "@/db/queries/sessions";
import { useSettings } from "@/db/queries/settings";
import { formatClock } from "@/lib/format";
import { restDurationFor } from "@/lib/rest";
import { useSessionStore } from "@/lib/session-store";
import { useNow } from "@/lib/use-now";

export default function SessionChecklist() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const ghosts = useGhostSets(session?.entries.map((e) => e.exerciseId) ?? [], sessionId);
  const settings = useSettings();
  const now = useNow();
  const { restEndsAt, restDurationSec, startRest, clearRest, setPosition, end } =
    useSessionStore();
  const [reopenedIndex, setReopenedIndex] = useState<number | null>(null);

  if (!session) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const grouped = groupSetsByEntry(session.entries, sets);
  const ghostByEntry = groupSetsByEntry(session.entries, ghosts);
  const done = grouped.map((g) => g.length);
  const position = nextPosition(session.entries, done);
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const restRemainingSec = restEndsAt
    ? Math.min(restDurationSec, Math.ceil((restEndsAt - now) / 1000))
    : 0;
  const resting = restRemainingSec > 0;

  const logCurrentSet = (setNumber: number) => {
    if (!position) return;
    const entry = session.entries[position.exerciseIndex];
    logSet({
      sessionId,
      exerciseId: entry.exerciseId,
      setNumber,
      reps: entry.targetReps,
      timeSec: entry.targetTimeSec,
      weightKg: entry.targetWeightKg,
    });
    const lastSetOfExercise = setNumber >= entry.targetSets;
    const lastExercise = position.exerciseIndex === session.entries.length - 1;
    if (lastSetOfExercise) setPosition(position.exerciseIndex + 1, 1);
    else setPosition(position.exerciseIndex, setNumber + 1);
    if (settings.autostartRestTimer && !(lastSetOfExercise && lastExercise)) {
      startRest(restDurationFor(entry, settings, lastSetOfExercise));
    }
  };

  // Only the last logged set of the current exercise can be undone, so set numbers stay contiguous.
  const unlogSet = (setId: number) => {
    deleteSet(setId);
    clearRest();
  };

  const finish = () => {
    const complete = () => {
      finishSession(sessionId);
      end();
      router.dismissTo("/");
    };
    if (!position) return complete();
    const remaining = session.entries.reduce((n, e) => n + e.targetSets, 0) - sets.length;
    Alert.alert("Finish early?", `${remaining} planned ${remaining === 1 ? "set is" : "sets are"} still open.`, [
      { text: "Keep going", style: "cancel" },
      { text: "Finish", style: "destructive", onPress: complete },
    ]);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-3">
        <View>
          <Text className="font-archivo-bold text-[11px] tracking-[1.5px] text-muted">
            {session.routineName.toUpperCase()}
          </Text>
          <Text
            className="font-archivo-black text-[22px] text-text mt-0.5"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatClock(elapsedSec)}
          </Text>
        </View>
        <Button label="Finish" size="sm" onPress={finish} />
      </View>
      <FlatList
        data={session.entries}
        keyExtractor={(entry, index) => `${entry.exerciseId}-${index}`}
        contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 120, gap: 8 }}
        renderItem={({ item, index }) => {
          if (position?.exerciseIndex === index) {
            return (
              <ExpandedExerciseCard
                entry={item}
                loggedSets={grouped[index]}
                ghostSets={ghostByEntry[index]}
                current
                restHint={
                  settings.autostartRestTimer
                    ? `Tap the box to log a set · rest ${settings.restBetweenSetsSec} s auto-starts`
                    : "Tap the box to log a set"
                }
                onLogSet={logCurrentSet}
                onUnlogSet={unlogSet}
                onOpenSet={(setNumber) => {
                        setPosition(index, setNumber);
                        router.push({ pathname: "/session/[id]/focus", params: { id } });
                      }}
              />
            );
          }
          const complete = done[index] >= item.targetSets;
          if (complete && reopenedIndex === index) {
            return (
              <ExpandedExerciseCard
                entry={item}
                loggedSets={grouped[index]}
                ghostSets={ghostByEntry[index]}
                current={false}
                onLogSet={() => {}}
                onUnlogSet={unlogSet}
                onCollapse={() => setReopenedIndex(null)}
              />
            );
          }
          return (
            <CollapsedExerciseCard
              entry={item}
              done={done[index]}
              onPress={complete ? () => setReopenedIndex(index) : undefined}
            />
          );
        }}
        ListFooterComponent={
          position ? null : (
            <Text className="font-archivo text-sm text-muted text-center mt-4">
              {"All sets logged — finish when you're ready."}
            </Text>
          )
        }
      />
      {resting ? (
        <View
          className="absolute left-0 right-0 bottom-0 px-5 pt-3.5 bg-bg"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <RestBar
            remainingSec={restRemainingSec}
            onSkip={clearRest}
            onOpen={() => router.push({ pathname: "/session/[id]/rest", params: { id } })}
          />
        </View>
      ) : null}
    </View>
  );
}
