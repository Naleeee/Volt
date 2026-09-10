import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
  finishSession,
  logSet,
  startSession,
  type LogSetInput,
  type SessionDetail,
  type SessionEntry,
} from "@/db/queries/sessions";
import type { Settings } from "@/db/queries/settings";
import { restDurationFor } from "@/lib/rest";
import { nextPositionFrom, openSetNumbers } from "@/lib/session-sets";
import { useSessionStore } from "@/lib/session-store";
import { toast } from "@/lib/toast";

export function startWorkout(routineId: number) {
  try {
    const session = startSession(routineId);
    useSessionStore.getState().begin(session.id);
    router.push({
      pathname: "/session/[id]",
      params: { id: String(session.id) },
    });
  } catch (error) {
    if (__DEV__) console.error(error);
    toast.error("Finish or discard your current workout first.");
  }
}

type SetValues = Omit<LogSetInput, "sessionId" | "exerciseId" | "setNumber">;

// Writes the set, points the store at the nearest open set, and starts rest unless the workout is complete.
export function logSetAndAdvance(
  session: Pick<SessionDetail, "id" | "entries">,
  grouped: { setNumber: number }[][],
  index: number,
  setNumber: number,
  settings: Settings,
  values: SetValues,
): { lastOfExercise: boolean; restStarted: boolean } {
  const entry = session.entries[index];
  if (!values.skipped) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  logSet({
    sessionId: session.id,
    exerciseId: entry.exerciseId,
    setNumber,
    ...values,
  });

  const after = grouped.map((g, i) => (i === index ? [...g, { setNumber }] : g));
  const lastOfExercise = openSetNumbers(entry, after[index]).length === 0;
  const next = nextPositionFrom(session.entries, after, index);
  const { setPosition, startRest, clearRest } = useSessionStore.getState();
  setPosition(next?.exerciseIndex ?? index, next?.setNumber ?? setNumber);

  const restStarted =
    !values.skipped && settings.autostartRestTimer && next !== null;
  if (restStarted) startRest(restDurationFor(entry, settings, lastOfExercise));
  else clearRest();
  return { lastOfExercise, restStarted };
}

// Finishes immediately when every planned set is logged, otherwise asks first.
export function finishWorkout(
  sessionId: number,
  entries: Pick<SessionEntry, "targetSets">[],
  loggedCount: number,
) {
  const done = () => {
    finishSession(sessionId);
    useSessionStore.getState().end();
    router.dismissTo("/");
    router.push({
      pathname: "/session/[id]/summary",
      params: { id: String(sessionId) },
    });
  };
  const remaining =
    entries.reduce((n, e) => n + e.targetSets, 0) - loggedCount;
  if (remaining <= 0) return done();
  Alert.alert(
    "Finish early?",
    `${remaining} planned ${remaining === 1 ? "set is" : "sets are"} still open.`,
    [
      { text: "Keep going", style: "cancel" },
      { text: "Finish", style: "destructive", onPress: done },
    ],
  );
}

// Remaining rest in whole seconds; 0 when no rest is running.
export function restRemainingSec(
  restEndsAt: number | null,
  restDurationSec: number,
  now: number,
) {
  return restEndsAt === null
    ? 0
    : Math.min(restDurationSec, Math.ceil((restEndsAt - now) / 1000));
}
