import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TimerRing from "@/components/sessions/TimerRing";
import Button from "@/components/UI/Button";
import MediaThumb from "@/components/UI/MediaThumb";
import Screen from "@/components/UI/Screen";
import { colors } from "@/constants/theme";
import { useSession, useSessionSets } from "@/db/queries/sessions";
import { groupSetsByEntry, nextPosition } from "@/lib/session-sets";
import { MeasuredBy } from "@/lib/enums";
import { formatClock } from "@/lib/format";
import { restRemainingSec } from "@/lib/session-flow";
import { useSessionStore } from "@/lib/session-store";
import { useNow } from "@/lib/use-now";

export default function RestScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const now = useNow();
  const { restEndsAt, restDurationSec, extendRest, clearRest } =
    useSessionStore();

  const remainingSec = restRemainingSec(restEndsAt, restDurationSec, now);
  const over = restEndsAt === null || remainingSec <= 0;

  useEffect(() => {
    if (over) {
      clearRest();
      if (router.canGoBack()) router.back();
    }
  }, [over, clearRest]);

  const skip = () => {
    clearRest();
    router.back();
  };

  const upNext = (() => {
    if (!session) return null;
    const done = groupSetsByEntry(session.entries, sets).map((g) => g.length);
    const position = nextPosition(session.entries, done);
    if (!position)
      return { entry: null, label: "All sets done — finish when you're ready" };
    const entry = session.entries[position.exerciseIndex];
    const target =
      entry.measuredBy === MeasuredBy.Reps
        ? `${entry.targetReps ?? "–"} reps`
        : entry.measuredBy === MeasuredBy.Time
          ? `${entry.targetTimeSec ?? "–"} sec`
          : "free-form";
    return {
      entry,
      label: `${entry.name} · Set ${position.setNumber} of ${entry.targetSets} · ${target}`,
    };
  })();

  return (
    <Screen>
      <Text className="font-archivo-bold text-sm tracking-widest text-muted text-center mt-2.5">
        {session ? `${session.routineName.toUpperCase()} · REST` : "REST"}
      </Text>

      <View className="flex-1 items-center justify-center">
        <TimerRing
          size={280}
          progress={restDurationSec > 0 ? remainingSec / restDurationSec : 0}
          color={colors.accent}
        >
          <Text
            className="font-archivo-black text-7xl text-text tracking-tight"
            style={{
              fontVariant: ["tabular-nums"],
              lineHeight: 76,
              includeFontPadding: false,
            }}
          >
            {formatClock(Math.max(0, remainingSec))}
          </Text>
          <Text className="font-archivo-bold text-sm tracking-widest text-muted mt-2">
            REST
          </Text>
        </TimerRing>
        <View className="flex-row gap-3 mt-8">
          <Button
            variant="secondary"
            size="md"
            label="+15 s"
            onPress={() => extendRest(15)}
          />
          <Button
            variant="outline"
            size="md"
            label="Skip rest"
            onPress={skip}
          />
        </View>
      </View>

      <View
        className="flex-row items-center gap-3 bg-card border border-line rounded-2xl px-3.5 py-3"
        style={{ marginBottom: insets.bottom + 28 }}
      >
        <MediaThumb
          path={upNext?.entry?.mediaPath ?? null}
          type={upNext?.entry?.mediaType ?? null}
          className="w-11 h-11 rounded-xl"
        />
        <View className="flex-1">
          <Text className="font-archivo-bold text-sm tracking-widest text-muted">
            UP NEXT
          </Text>
          <Text
            className="font-archivo-bold text-base text-text mt-0.5"
            numberOfLines={1}
          >
            {upNext?.label ?? ""}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
