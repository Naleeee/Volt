import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import RestBar from "@/components/sessions/RestBar";
import {
  CollapsedExerciseCard,
  ExpandedExerciseCard,
} from "@/components/sessions/SessionChecklistCard";
import BottomBar from "@/components/UI/BottomBar";
import Button from "@/components/UI/Button";
import LoadingScreen from "@/components/UI/LoadingScreen";
import Screen from "@/components/UI/Screen";
import {
  deleteSet,
  useGhostSets,
  useSession,
  useSessionSets,
} from "@/db/queries/sessions";
import { groupSetsByEntry, nextPosition } from "@/lib/session-sets";
import { useSettings } from "@/db/queries/settings";
import { formatClock } from "@/lib/format";
import { restDurationFor } from "@/lib/rest";
import {
  finishWorkout,
  logSetAndAdvance,
  restRemainingSec,
} from "@/lib/session-flow";
import { useSessionStore } from "@/lib/session-store";
import { useNow } from "@/lib/use-now";

export default function SessionChecklist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const ghosts = useGhostSets(
    session?.entries.map((e) => e.exerciseId) ?? [],
    sessionId,
  );
  const settings = useSettings();
  const now = useNow();
  const { restEndsAt, restDurationSec, clearRest, setPosition } =
    useSessionStore();
  const [reopenedIndex, setReopenedIndex] = useState<number | null>(null);
  const navigation = useNavigation();

  usePreventRemove(true, ({ data }) => {
    if (useSessionStore.getState().sessionId === null) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(
      "Leave workout?",
      "It stays in progress — resume it from Home.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  if (!session) return <LoadingScreen />;

  const grouped = groupSetsByEntry(session.entries, sets);
  const ghostByEntry = groupSetsByEntry(session.entries, ghosts);
  const done = grouped.map((g) => g.length);
  const position = nextPosition(session.entries, done);
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const restRemaining = restRemainingSec(restEndsAt, restDurationSec, now);
  const resting = restRemaining > 0;

  const logCurrentSet = (setNumber: number) => {
    if (!position) return;
    const entry = session.entries[position.exerciseIndex];
    logSetAndAdvance(session, position.exerciseIndex, setNumber, settings, {
      reps: entry.targetReps,
      timeSec: entry.targetTimeSec,
      weightKg: entry.targetWeightKg,
    });
  };

  // Only the last logged set of the current exercise can be undone, so set numbers stay contiguous.
  const unlogSet = (setId: number) => {
    deleteSet(setId);
    clearRest();
  };

  const finish = () => finishWorkout(sessionId, session.entries, sets.length);

  return (
    <Screen>
      {settings.keepAwake ? <KeepAwake /> : null}
      <View className="flex-row items-center justify-between px-5 pt-3">
        <View>
          <Text className="font-archivo-bold text-xs tracking-widest text-muted">
            {session.routineName.toUpperCase()}
          </Text>
          <Text
            className="font-archivo-black text-2xl text-text mt-0.5"
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
        contentContainerStyle={{
          padding: 20,
          paddingTop: 14,
          paddingBottom: 120,
          gap: 8,
        }}
        renderItem={({ item, index }) => {
          if (position && position.exerciseIndex === index) {
            const restSec = restDurationFor(
              item,
              settings,
              position.setNumber >= item.targetSets,
            );
            return (
              <ExpandedExerciseCard
                entry={item}
                loggedSets={grouped[index]}
                ghostSets={ghostByEntry[index]}
                current
                restHint={
                  settings.autostartRestTimer
                    ? `Tap the box to log a set · rest ${restSec} s auto-starts`
                    : "Tap the box to log a set"
                }
                onLogSet={logCurrentSet}
                onUnlogSet={unlogSet}
                onOpenSet={(setNumber) => {
                  setPosition(index, setNumber);
                  router.push({
                    pathname: "/session/[id]/focus",
                    params: { id },
                  });
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
        <BottomBar>
          <RestBar
            remainingSec={restRemaining}
            onSkip={clearRest}
            onOpen={() =>
              router.push({ pathname: "/session/[id]/rest", params: { id } })
            }
          />
        </BottomBar>
      ) : null}
    </Screen>
  );
}

// Hooks can't be conditional, so the setting mounts and unmounts this instead.
function KeepAwake() {
  useKeepAwake();
  return null;
}
