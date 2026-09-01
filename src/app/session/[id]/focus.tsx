import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Minus, Pause, Play, Plus } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TimerRing from "@/components/sessions/TimerRing";
import Button from "@/components/UI/Button";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import { colors } from "@/constants/theme";
import {
  finishSession,
  groupSetsByEntry,
  logSet,
  useGhostSets,
  useLastPerformedSet,
  useSession,
  useSessionSets,
  type SessionEntry,
} from "@/db/queries/sessions";
import type { SessionSet } from "@/db/schema";
import { useSettings } from "@/db/queries/settings";
import { MeasuredBy } from "@/lib/enums";
import { describeSet } from "@/lib/describe-set";
import { formatClock, formatWeight } from "@/lib/format";
import { restDurationFor } from "@/lib/rest";
import { useSessionStore } from "@/lib/session-store";
import { playTimerSound } from "@/lib/sounds";
import { useNow } from "@/lib/use-now";

export default function SetFocus() {
  const insets = useSafeAreaInsets();
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
  const { exerciseIndex, setPosition, startRest, resetHold, end } =
    useSessionStore();

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
  const ghost = groupSetsByEntry(entries, ghosts)[index][setNumber - 1];
  const exerciseDone = setNumber > entry.targetSets;
  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));

  const advance = (lastOfExercise: boolean) => {
    if (lastOfExercise) setPosition(Math.min(index + 1, entries.length - 1), 1);
    else setPosition(index, setNumber + 1);
  };

  // Writes the set, moves the pointer, starts rest, returns to the checklist.
  const complete = (values: {
    reps?: number | null;
    timeSec?: number | null;
    weightKg?: number | null;
    note?: string | null;
  }) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logSet({ sessionId, exerciseId: entry.exerciseId, setNumber, ...values });
    const last = setNumber >= entry.targetSets;
    resetHold();
    advance(last);
    if (
      settings.autostartRestTimer &&
      !(last && index === entries.length - 1)
    ) {
      startRest(restDurationFor(entry, settings, last));
      router.replace({ pathname: "/session/[id]/rest", params: { id } });
    } else {
      router.back();
    }
  };

  const skip = () => {
    logSet({
      sessionId,
      exerciseId: entry.exerciseId,
      setNumber,
      skipped: true,
    });
    const last = setNumber >= entry.targetSets;
    resetHold();
    advance(last);
    if (last) router.back();
  };

  const finish = () => {
    const done = () => {
      finishSession(sessionId);
      end();
      router.dismissTo("/");
      router.push({ pathname: "/session/[id]/summary", params: { id } });
    };
    const remaining =
      entries.reduce((n, e) => n + e.targetSets, 0) - sets.length;
    if (remaining <= 0) return done();
    Alert.alert(
      "Finish early?",
      `${remaining} planned ${remaining === 1 ? "set is" : "sets are"} still open.`,
      [
        { text: "Keep going", style: "cancel" },
        { text: "Finish", style: "destructive", onPress: done },
      ],
    );
  };

  const footer = (
    primary: ReactNode,
    secondaryLabel: string,
    onSecondary: () => void,
    secondaryDisabled = false,
  ) => (
    <View style={{ paddingBottom: insets.bottom + 10 }}>
      {primary}
      <View className="flex-row justify-between px-2 pt-3.5 pb-2">
        <Pressable
          onPress={onSecondary}
          disabled={secondaryDisabled}
          hitSlop={8}
          className="active:opacity-80"
        >
          <Text
            className={`font-archivo-bold text-sm ${secondaryDisabled ? "text-muted/40" : "text-muted"}`}
          >
            {secondaryLabel}
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
          <Text className="font-archivo-bold text-sm text-danger">Finish</Text>
        </Pressable>
      </View>
    </View>
  );

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
            <Text className="font-archivo-bold text-[11px] tracking-[1.5px] text-muted">
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

      {exerciseDone ? (
        <>
          <TitleBlock
            entry={entry}
            setNumber={setNumber}
            logged={logged}
            subtitle={`All ${entry.targetSets} sets logged`}
          />
          <View className="flex-1 items-center justify-center">
            <Text className="font-archivo text-sm text-muted">{`All ${entry.targetSets} sets of ${entry.name} are logged.`}</Text>
          </View>
          {footer(
            <Button label="Back to list" onPress={() => router.back()} />,
            "Skip set",
            skip,
            true,
          )}
        </>
      ) : entry.measuredBy === MeasuredBy.Time ? (
        <TimeFocus
          entry={entry}
          ghost={ghost}
          setNumber={setNumber}
          logged={logged}
          now={now}
          autoRest={settings.autostartRestTimer}
          onComplete={complete}
          footer={footer}
          onSkip={skip}
        />
      ) : entry.measuredBy === MeasuredBy.Reps ? (
        <RepsFocus
          entry={entry}
          ghost={ghost}
          setNumber={setNumber}
          logged={logged}
          autoRest={settings.autostartRestTimer}
          onComplete={complete}
          footer={footer}
          onSkip={skip}
        />
      ) : (
        <OtherFocus
          entry={entry}
          ghost={ghost}
          setNumber={setNumber}
          logged={logged}
          sessionId={sessionId}
          autoRest={settings.autostartRestTimer}
          onComplete={complete}
          footer={footer}
          onSkip={skip}
        />
      )}
    </View>
  );
}

type FocusProps = {
  entry: SessionEntry;
  setNumber: number;
  logged: SessionSet[];
  ghost?: SessionSet;
  autoRest: boolean;
  onComplete: (values: {
    reps?: number | null;
    timeSec?: number | null;
    weightKg?: number | null;
    note?: string | null;
  }) => void;
  onSkip: () => void;
  footer: (
    primary: ReactNode,
    secondaryLabel: string,
    onSecondary: () => void,
    secondaryDisabled?: boolean,
  ) => ReactNode;
};

function TitleBlock({
  entry,
  setNumber,
  logged,
  subtitle,
  compact = false,
}: {
  entry: SessionEntry;
  setNumber: number;
  logged: SessionSet[];
  subtitle: string;
  compact?: boolean;
}) {
  const type = MEASURED_BY_STYLES[entry.measuredBy];
  const done = setNumber > entry.targetSets;
  return (
    <>
      {compact ? null : (
        <MediaThumb
          path={entry.mediaPath}
          type={entry.mediaType}
          className="h-[150px] rounded-3xl mt-4"
        />
      )}
      <View
        className={`flex-row items-end justify-between mt-4 ${compact ? "gap-3.5" : ""}`}
      >
        {compact ? (
          <MediaThumb
            path={entry.mediaPath}
            type={entry.mediaType}
            className="w-14 h-14 rounded-2xl"
          />
        ) : null}
        <View className="flex-1 pr-3">
          <Text
            className={`font-archivo-black ${compact ? "text-[26px]" : "text-[28px]"} text-text tracking-[-0.5px]`}
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          <Text className="font-archivo-semibold text-sm text-muted mt-0.5">
            {subtitle}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`font-archivo-bold text-[13px] ${type.text}`}>
            {done ? "ALL DONE" : `SET ${setNumber} OF ${entry.targetSets}`}
          </Text>
          <View className="flex-row gap-[5px] mt-[7px]">
            {Array.from({ length: entry.targetSets }, (_, i) => {
              const s = logged[i];
              const cls = s
                ? s.skipped
                  ? "bg-white/30"
                  : type.bg
                : i + 1 === setNumber
                  ? `border-[1.5px] ${type.ring}`
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
    </>
  );
}

function GhostLine({
  set,
  measuredBy,
}: {
  set: SessionSet | undefined;
  measuredBy: SessionEntry["measuredBy"];
}) {
  if (!set) return null;
  return (
    <Text
      className="font-archivo text-[13px] text-muted text-center mb-1.5"
      numberOfLines={1}
    >
      {`Last time · }`}
      <Text className="font-archivo-bold text-text">
        {describeSet(set, measuredBy)}
      </Text>
    </Text>
  );
}

function LastSetLine({
  set,
  unit,
}: {
  set: SessionSet | undefined;
  unit: "reps" | "sec" | "note";
}) {
  if (!set)
    return (
      <Text className="font-archivo text-[13px] text-muted text-center mb-3.5">
        {" "}
      </Text>
    );
  const value =
    unit === "reps" ? set.reps : unit === "sec" ? set.timeSec : set.note;
  const weight =
    set.weightKg !== null ? ` @ ${formatWeight(set.weightKg)}` : "";
  return (
    <Text className="font-archivo text-[13px] text-muted text-center mb-3.5">
      Set {set.setNumber} ·{" "}
      <Text className="font-archivo-bold text-text">
        {unit === "note" ? value : `${value} ${unit}${weight}`}
      </Text>
      <Text className="text-accent">✓</Text>
    </Text>
  );
}

function RepsFocus({
  entry,
  setNumber,
  logged,
  ghost,
  autoRest,
  onComplete,
  onSkip,
  footer,
}: FocusProps) {
  const [repsOverride, setRepsOverride] = useState<number | null>(null);
  const [weightOverride, setWeightOverride] = useState<number | null>(null);
  const reps = repsOverride ?? entry.targetReps ?? 0;
  const hasWeight = entry.targetWeightKg !== null;
  const weight = weightOverride ?? entry.targetWeightKg ?? 0;
  const lastLogged = [...logged].reverse().find((s) => !s.skipped);
  const subtitle = `${hasWeight ? `${formatWeight(weight)} · ` : ""}target ${entry.targetReps ?? "–"} reps`;

  return (
    <>
      <TitleBlock
        entry={entry}
        setNumber={setNumber}
        logged={logged}
        subtitle={subtitle}
      />
      <View className="flex-1 flex-row items-center justify-center gap-[26px]">
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
          <StepButton
            small
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
          <StepButton
            small
            icon={Plus}
            label="2.5 kg more"
            onPress={() => setWeightOverride(weight + 2.5)}
          />
        </View>
      ) : null}
      <GhostLine set={ghost} measuredBy={entry.measuredBy} />
      <LastSetLine set={lastLogged} unit="reps" />
      {footer(
        <Button
          label={autoRest ? "Log set · start rest" : "Log set"}
          onPress={() =>
            onComplete({ reps, weightKg: hasWeight ? weight : null })
          }
        />,
        "Skip set",
        onSkip,
      )}
    </>
  );
}

function TimeFocus({
  entry,
  setNumber,
  logged,
  ghost,
  now,
  onComplete,
  onSkip,
  footer,
}: FocusProps & { now: number }) {
  const { holdStartedAt, holdElapsedMs, startHold, pauseHold } =
    useSessionStore();
  const targetSec = entry.targetTimeSec ?? 0;
  const running = holdStartedAt !== null;
  const elapsedMs =
    holdElapsedMs + (running ? Math.max(0, now - holdStartedAt) : 0);
  const remainingMs = Math.max(0, targetSec * 1000 - elapsedMs);
  const reachedTarget = running && remainingMs <= 0;
  const lastLogged = [...logged].reverse().find((s) => !s.skipped);

  // The countdown crossing zero is a clock event, not a tap — log the target once it happens.
  useEffect(() => {
    if (!reachedTarget) return;
    void playTimerSound("time");
    onComplete({ timeSec: targetSec, weightKg: entry.targetWeightKg });
  }, [reachedTarget, onComplete, targetSec, entry.targetWeightKg]);

  const label = running ? "Pause" : elapsedMs > 0 ? "Resume" : "Start hold";
  const Icon = running ? Pause : Play;

  return (
    <>
      <TitleBlock
        entry={entry}
        setNumber={setNumber}
        logged={logged}
        subtitle={`target ${targetSec} sec`}
        compact
      />
      <View className="flex-1 items-center justify-center">
        <TimerRing
          progress={targetSec > 0 ? remainingMs / (targetSec * 1000) : 0}
          color={colors.time}
        >
          <Text
            className="font-archivo-black text-[72px] text-time tracking-[-2px]"
            style={{
              fontVariant: ["tabular-nums"],
              lineHeight: 72,
              includeFontPadding: false,
            }}
          >
            {formatClock(Math.ceil(remainingMs / 1000))}
          </Text>
          <Text className="font-archivo-bold text-xs tracking-[2.4px] text-muted mt-2">
            HOLD
          </Text>
        </TimerRing>
        <View className="mt-[18px]">
          <GhostLine set={ghost} measuredBy={entry.measuredBy} />
          <LastSetLine set={lastLogged} unit="sec" />
        </View>
      </View>
      {footer(
        <Button
          variant="time"
          label={label}
          icon={Icon}
          iconFill
          onPress={running ? pauseHold : startHold}
        />,
        elapsedMs > 0 ? "Log early" : "Skip set",
        elapsedMs > 0
          ? () =>
              onComplete({
                timeSec: Math.max(1, Math.round(elapsedMs / 1000)),
                weightKg: entry.targetWeightKg,
              })
          : onSkip,
      )}
    </>
  );
}

function OtherFocus({
  entry,
  setNumber,
  logged,
  ghost,
  sessionId,
  autoRest,
  onComplete,
  onSkip,
  footer,
}: FocusProps & { sessionId: number }) {
  const [note, setNote] = useState("");
  const lastLogged = [...logged].reverse().find((s) => !s.skipped);
  const lastSession = useLastPerformedSet(entry.exerciseId, sessionId);
  const chips = [
    { label: "Same as last set", value: lastLogged?.note ?? null },
    { label: "Same as last session", value: lastSession?.note ?? null },
  ];

  return (
    <>
      <TitleBlock
        entry={entry}
        setNumber={setNumber}
        logged={logged}
        subtitle="free-form · log what you did"
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        textAlignVertical="top"
        placeholder="e.g. 2 × 20 m @ 32 kg per hand"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Set note"
        className="bg-card2 border border-other rounded-2xl min-h-[84px] px-4 py-3.5 mt-3.5 font-archivo-semibold text-[17px] leading-[26px] text-text"
        style={{ includeFontPadding: false }}
      />
      <View className="flex-row gap-2 mt-2.5">
        {chips.map((chip) => (
          <Pressable
            key={chip.label}
            disabled={!chip.value}
            onPress={() => chip.value && setNote(chip.value)}
            accessibilityRole="button"
            className={`rounded-full bg-card2 border border-line px-3.5 py-2 active:opacity-80 ${chip.value ? "" : "opacity-40"}`}
          >
            <Text className="font-archivo-bold text-xs text-muted">
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-1" />
      <GhostLine set={ghost} measuredBy={entry.measuredBy} />
      <LastSetLine set={lastLogged} unit="note" />
      {footer(
        <Button
          label={autoRest ? "Log set · start rest" : "Log set"}
          onPress={() => onComplete({ note: note.trim() || null })}
        />,
        "Skip set",
        onSkip,
      )}
    </>
  );
}

function StepButton({
  icon: Icon,
  label,
  onPress,
  small = false,
}: {
  icon: typeof Minus;
  label: string;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`${small ? "w-11 h-11" : "w-[68px] h-[68px]"} rounded-full bg-card2 border border-line items-center justify-center active:scale-95 active:opacity-90`}
    >
      <Icon size={small ? 18 : 28} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}
