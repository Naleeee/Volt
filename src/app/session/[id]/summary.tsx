import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/UI/Button";
import LoadingScreen from "@/components/UI/LoadingScreen";
import Screen from "@/components/UI/Screen";
import { colors } from "@/constants/theme";
import {
  groupSetsByEntry,
  useSession,
  useSessionSets,
} from "@/db/queries/sessions";
import { MeasuredBy } from "@/lib/enums";
import { formatClock } from "@/lib/format";

export default function SessionSummary() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);

  if (!session) return <LoadingScreen />;

  const endedAt = session.endedAt ?? Date.now();
  const durationSec = Math.max(
    0,
    Math.floor((endedAt - session.startedAt) / 1000),
  );
  // Skipped sets are stored rows but not work done: they count toward neither logged nor complete.
  const rows = groupSetsByEntry(session.entries, sets).map((group, i) => {
    const entry = session.entries[i];
    const performed = group.filter((s) => !s.skipped);
    return { entry, performed, complete: performed.length >= entry.targetSets };
  });
  const planned = session.entries.reduce((n, e) => n + e.targetSets, 0);
  const logged = rows.reduce((n, r) => n + r.performed.length, 0);
  const completed = rows.filter((r) => r.complete).length;
  const volumeKg = rows.reduce(
    (n, r) =>
      n +
      r.performed.reduce((v, s) => v + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
    0,
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 40,
          paddingBottom: 24,
        }}
      >
        <View className="items-center">
          <View
            className="w-20 h-20 rounded-full bg-accent items-center justify-center"
            style={{
              elevation: 8,
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 17,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            <Check size={34} strokeWidth={4} color={colors["accent-ink"]} />
          </View>
          <Text className="font-archivo-black text-3xl text-text tracking-tight mt-5">
            Workout complete
          </Text>
          <Text className="font-archivo text-sm text-muted mt-1">
            {session.routineName} · {format(endedAt, "EEE d MMM · HH:mm")}
          </Text>
        </View>

        <View className="flex-row gap-3 mt-7">
          <StatTile value={formatClock(durationSec)} label="Duration" />
          <StatTile value={String(logged)} of={planned} label="Sets logged" />
        </View>
        <View className="flex-row gap-3 mt-3">
          <StatTile
            value={String(completed)}
            of={session.entries.length}
            label="Exercises"
          />
          <StatTile
            value={Math.round(volumeKg).toLocaleString("en-US")}
            label="Volume (kg)"
          />
        </View>

        {rows.length ? (
          <View className="bg-card border border-line rounded-3xl px-4 py-1.5 mt-3.5">
            {rows.map(({ entry, performed, complete }, i) => {
              const notes =
                entry.measuredBy === MeasuredBy.Other
                  ? performed.map((s) => s.note).filter(Boolean)
                  : [];
              return (
                <View
                  key={`${entry.exerciseId}-${i}`}
                  className={`py-3 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text
                      className="flex-1 font-archivo-bold text-sm text-text"
                      numberOfLines={1}
                    >
                      {entry.name}
                    </Text>
                    <Text
                      className={`font-archivo-bold text-sm ${complete ? "text-accent" : "text-muted"}`}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {performed.length}/{entry.targetSets}
                    </Text>
                  </View>
                  {notes.length ? (
                    <Text className="font-archivo text-xs text-muted mt-1">
                      {notes.join(" · ")}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
      <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button label="Done" onPress={() => router.dismissTo("/")} />
      </View>
    </Screen>
  );
}

function StatTile({
  value,
  of,
  label,
}: {
  value: string;
  of?: number;
  label: string;
}) {
  return (
    <View className="flex-1 bg-card border border-line rounded-3xl p-5">
      <Text
        className="font-archivo-black text-3xl text-text"
        style={{ fontVariant: ["tabular-nums"], includeFontPadding: false }}
      >
        {value}
        {of !== undefined ? (
          <Text className="font-archivo-bold text-xl text-muted">/{of}</Text>
        ) : null}
      </Text>
      <Text className="font-archivo-semibold text-xs text-muted mt-0.5">
        {label}
      </Text>
    </View>
  );
}
