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
import {
  groupSetsByEntry,
  nextPosition,
  openSetNumbers,
} from "@/lib/session-sets";
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

// Manual expand/collapse taps, remembered only while the same exercise is active.
type Expansion = { active: number; toggled: Record<number, boolean> };

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
  const {
    exerciseIndex,
    setNumber: storedSet,
    restEndsAt,
    restDurationSec,
    clearRest,
    setPosition,
  } = useSessionStore();
  const [expansion, setExpansion] = useState<Expansion>({
    active: -1,
    toggled: {},
  });
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
  const activeIndex = Math.min(exerciseIndex, session.entries.length - 1);
  const allDone = nextPosition(session.entries, grouped) === null;
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const restRemaining = restRemainingSec(restEndsAt, restDurationSec, now);
  const resting = restRemaining > 0;

  const toggled = expansion.active === activeIndex ? expansion.toggled : {};
  const isExpanded = (index: number) => toggled[index] ?? index === activeIndex;
  const toggle = (index: number) =>
    setExpansion({
      active: activeIndex,
      toggled: { ...toggled, [index]: !isExpanded(index) },
    });

  const logSet = (index: number, setNumber: number) => {
    const entry = session.entries[index];
    logSetAndAdvance(session, grouped, index, setNumber, settings, {
      reps: entry.targetReps,
      timeSec: entry.targetTimeSec,
      weightKg: entry.targetWeightKg,
    });
  };

  const unlogSet = (setId: number) => {
    deleteSet(setId);
    clearRest();
  };

  const openSet = (index: number, setNumber: number) => {
    setPosition(index, setNumber);
    router.push({ pathname: "/session/[id]/focus", params: { id } });
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
          if (!isExpanded(index)) {
            return (
              <CollapsedExerciseCard
                entry={item}
                done={grouped[index].length}
                onPress={() => toggle(index)}
              />
            );
          }
          const open = openSetNumbers(item, grouped[index]);
          const current = index === activeIndex && open.length > 0;
          const restSec = restDurationFor(item, settings, open.length === 1);
          return (
            <ExpandedExerciseCard
              entry={item}
              loggedSets={grouped[index]}
              ghostSets={ghostByEntry[index]}
              current={current}
              nextSet={
                current ? (open.includes(storedSet) ? storedSet : open[0]) : undefined
              }
              restHint={
                !current
                  ? undefined
                  : settings.autostartRestTimer
                    ? `Tap the box to log a set · rest ${restSec} s auto-starts`
                    : "Tap the box to log a set"
              }
              onLogSet={(setNumber) => logSet(index, setNumber)}
              onUnlogSet={unlogSet}
              onOpenSet={(setNumber) => openSet(index, setNumber)}
              onCollapse={() => toggle(index)}
            />
          );
        }}
        ListFooterComponent={
          allDone ? (
            <Text className="font-archivo text-sm text-muted text-center mt-4">
              {"All sets logged — finish when you're ready."}
            </Text>
          ) : null
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
