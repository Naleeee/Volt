import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/UI/Button";
import { colors } from "@/constants/theme";
import {
  finishSession,
  groupSetsByEntry,
  logSet,
  useSession,
  useSessionSets,
} from "@/db/queries/sessions";
import { useSettings } from "@/db/queries/settings";
import { MeasuredBy } from "@/lib/enums";
import { formatClock, formatWeight } from "@/lib/format";
import { useSessionStore } from "@/lib/session-store";
import { useNow } from "@/lib/use-now";

export default function SetFocus() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const settings = useSettings();
  const now = useNow();
  const { exerciseIndex, setPosition, startRest, end } = useSessionStore();
  const [repsOverride, setRepsOverride] = useState<number | null>(null);
  const [weightOverride, setWeightOverride] = useState<number | null>(null);

  if (!session) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { entries } = session;
  const index = Math.min(Math.max(exerciseIndex, 0), entries.length - 1);
  const entry = entries[index];
  if (!entry) {
    return (
      <View className="flex-1 bg-bg items-center justify-center gap-4 px-5">
        <Text className="font-archivo text-sm text-muted">
          This routine has no exercises.
        </Text>
        <Button label="Back to list" onPress={() => router.back()} />
      </View>
    );
  }
  const grouped = groupSetsByEntry(entries, sets);
  const logged = grouped[index];
  const setNumber = logged.length + 1;
  const exerciseDone = setNumber > entry.targetSets;
  const reps = repsOverride ?? entry.targetReps ?? 0;
  const hasWeight = entry.targetWeightKg !== null;
  const weight = weightOverride ?? entry.targetWeightKg ?? 0;
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const lastLogged = [...logged].reverse().find((s) => !s.skipped);

  const advance = (lastOfExercise: boolean) => {
    if (lastOfExercise) setPosition(Math.min(index + 1, entries.length - 1), 1);
    else setPosition(index, setNumber + 1);
    setRepsOverride(null);
    setWeightOverride(null);
  };

  const log = () => {
    logSet({
      sessionId,
      exerciseId: entry.exerciseId,
      setNumber,
      reps,
      weightKg: hasWeight ? weight : null,
    });
    const last = setNumber >= entry.targetSets;
    advance(last);
    if (
      settings.autostartRestTimer &&
      !(last && index === entries.length - 1)
    ) {
      startRest(
        last ? settings.restBetweenExercisesSec : settings.restBetweenSetsSec,
      );
    }
    router.back();
  };

  const skip = () => {
    logSet({
      sessionId,
      exerciseId: entry.exerciseId,
      setNumber,
      skipped: true,
    });
    const last = setNumber >= entry.targetSets;
    advance(last);
    if (last) router.back();
  };

  const finish = () => {
    const complete = () => {
      finishSession(sessionId);
      end();
      router.dismissTo("/");
    };
    const remaining =
      entries.reduce((n, e) => n + e.targetSets, 0) - sets.length;
    if (remaining <= 0) return complete();
    Alert.alert(
      "Finish early?",
      `${remaining} planned ${remaining === 1 ? "set is" : "sets are"} still open.`,
      [
        { text: "Keep going", style: "cancel" },
        { text: "Finish", style: "destructive", onPress: complete },
      ],
    );
  };

  const weightLabel = hasWeight ? `${formatWeight(weight)} · ` : "";

  return (
    <View className="flex-1 bg-bg px-5" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to list"
          className="w-[38px] h-[38px] rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
        >
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-archivo-bold text-xs tracking-[1.5px] text-muted">
              {session.routineName.toUpperCase()} · {index + 1} OF{" "}
              {entries.length}
            </Text>
            <Text
              className="font-archivo-bold text-sm text-text"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatClock(elapsedSec)}
            </Text>
          </View>
          <View className="flex-row gap-1 mt-1.5">
            {entries.map((e, i) => (
              <View
                key={`${e.exerciseId}-${i}`}
                className={`flex-1 h-1 rounded-sm ${
                  grouped[i].length >= e.targetSets
                    ? "bg-accent"
                    : i === index
                      ? "bg-accent/45"
                      : "bg-white/[0.14]"
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="h-[150px] rounded-3xl bg-card2 mt-4" />

      <View className="flex-row items-end justify-between mt-4">
        <View className="flex-1 pr-3">
          <Text
            className="font-archivo-black text-2xl text-text tracking-tighter"
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          <Text className="font-archivo-semibold text-sm text-muted mt-0.5">
            {entry.measuredBy === MeasuredBy.Reps
              ? `${weightLabel}target ${entry.targetReps ?? "–"} reps`
              : "Time and free-form sets get their own view soon"}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-archivo-bold text-[13px] text-accent">
            {exerciseDone
              ? "ALL DONE"
              : `SET ${setNumber} OF ${entry.targetSets}`}
          </Text>
          <View className="flex-row gap-[5px] mt-[7px]">
            {Array.from({ length: entry.targetSets }, (_, i) => {
              const s = logged[i];
              const cls = s
                ? s.skipped
                  ? "bg-white/30"
                  : "bg-accent"
                : i + 1 === setNumber
                  ? "border-[1.5px] border-accent"
                  : "bg-white/[0.16]";
              return (
                <View
                  key={i}
                  className={`w-[9px] h-[9px] rounded-full ${cls}`}
                />
              );
            })}
          </View>
        </View>
      </View>

      {exerciseDone || entry.measuredBy !== MeasuredBy.Reps ? (
        <View className="flex-1 items-center justify-center">
          <Text className="font-archivo text-sm text-muted">
            {exerciseDone
              ? `All ${entry.targetSets} sets of ${entry.name} are logged.`
              : ""}
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-1 flex-row items-center justify-center gap-6">
            <StepButton
              icon={Minus}
              label="One rep less"
              onPress={() => setRepsOverride(Math.max(0, reps - 1))}
            />
            <View className="items-center min-w-[130px]">
              <Text
                className="font-archivo-black text-[104px] text-text tracking-[-3px]"
                style={{
                  fontVariant: ["tabular-nums"],
                  lineHeight: 104,
                  includeFontPadding: false,
                }}
              >
                {reps}
              </Text>
              <Text className="font-archivo-bold text-xs tracking-[1.5px] text-muted mt-1.5">
                REPS DONE
              </Text>
            </View>
            <StepButton
              icon={Plus}
              label="One rep more"
              onPress={() => setRepsOverride(reps + 1)}
            />
          </View>
          {hasWeight ? (
            <View className="flex-row items-center justify-center gap-3 mb-3.5">
              <SmallStepButton
                icon={Minus}
                label="2.5 kg less"
                onPress={() => setWeightOverride(Math.max(0, weight - 2.5))}
              />
              <View className="min-w-[92px] items-center">
                <Text
                  className="font-archivo-black text-[22px] text-text"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatWeight(weight)}
                </Text>
              </View>
              <SmallStepButton
                icon={Plus}
                label="2.5 kg more"
                onPress={() => setWeightOverride(weight + 2.5)}
              />
            </View>
          ) : null}
          <Text className="font-archivo text-sm text-muted text-center mb-3.5">
            {lastLogged ? (
              <>
                Set {lastLogged.setNumber} ·{" "}
                <Text className="font-archivo-bold text-text">
                  {lastLogged.reps} reps{lastLogged.weightKg !== null ? ` @ ${formatWeight(lastLogged.weightKg)}` : ""}
                </Text>{" "}
                <Text className="text-accent">✓</Text>
              </>
            ) : (
              " "
            )}
          </Text>
        </>
      )}

      <View style={{ paddingBottom: insets.bottom + 10 }}>
        {exerciseDone || entry.measuredBy !== MeasuredBy.Reps ? (
          <Button label="Back to list" onPress={() => router.back()} />
        ) : (
          <Button
            label={
              settings.autostartRestTimer ? "Log set · start rest" : "Log set"
            }
            onPress={log}
          />
        )}
        <View className="flex-row justify-between px-2 pt-3.5 pb-2">
          <Pressable
            onPress={skip}
            disabled={exerciseDone}
            hitSlop={8}
            className="active:opacity-80"
          >
            <Text
              className={`font-archivo-bold text-sm ${exerciseDone ? "text-muted/40" : "text-muted"}`}
            >
              Skip set
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="active:opacity-80"
          >
            <Text className="font-archivo-bold text-sm text-muted">
              Back to list
            </Text>
          </Pressable>
          <Pressable onPress={finish} hitSlop={8} className="active:opacity-80">
            <Text className="font-archivo-bold text-sm text-danger">
              Finish
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SmallStepButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Minus;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-11 h-11 rounded-full bg-card2 border border-line items-center justify-center active:scale-95 active:opacity-90"
    >
      <Icon size={18} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}

function StepButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Minus;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-[68px] h-[68px] rounded-full bg-card2 border border-line items-center justify-center active:scale-95 active:opacity-90"
    >
      <Icon size={28} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}
