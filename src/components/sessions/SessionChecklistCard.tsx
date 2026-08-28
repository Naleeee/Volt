import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import type { SessionEntry } from "@/db/queries/sessions";
import type { SessionSet } from "@/db/schema";
import { MeasuredBy } from "@/lib/enums";
import { formatWeight } from "@/lib/format";

// "4 × 8 · 60 kg" / "3 × 45 sec" / "3 sets"
export function describeEntry(entry: SessionEntry) {
  const weight = entry.targetWeightKg !== null ? ` · ${formatWeight(entry.targetWeightKg)}` : "";
  if (entry.measuredBy === MeasuredBy.Reps) return `${entry.targetSets} × ${entry.targetReps ?? "–"}${weight}`;
  if (entry.measuredBy === MeasuredBy.Time) return `${entry.targetSets} × ${entry.targetTimeSec ?? "–"} sec${weight}`;
  return `${entry.targetSets} ${entry.targetSets === 1 ? "set" : "sets"}`;
}

type CollapsedProps = { entry: SessionEntry; done: number; onPress?: () => void };

// Collapsed card: completed (struck through, tappable to reopen) or upcoming (0/n).
export function CollapsedExerciseCard({ entry, done, onPress }: CollapsedProps) {
  const complete = done >= entry.targetSets;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Show ${entry.name} sets` : undefined}
      className={`flex-row items-center gap-2.5 bg-card border border-line rounded-[18px] px-3 py-2.5 ${complete ? "opacity-55 active:opacity-80" : ""}`}
    >
      <View className="w-10 h-10 rounded-[10px] bg-card2" />
      <View className="flex-1">
        <Text
          className={`font-archivo-bold text-[15px] text-text ${complete ? "line-through" : ""}`}
          numberOfLines={1}
        >
          {entry.name}
        </Text>
        <Text className="font-archivo text-xs text-muted">
          {complete ? `${done}/${entry.targetSets} sets done` : describeEntry(entry)}
        </Text>
      </View>
      {complete ? (
        <Check size={18} color={colors.accent} />
      ) : (
        <Text className="font-archivo-bold text-xs text-muted" style={{ fontVariant: ["tabular-nums"] }}>
          {done}/{entry.targetSets}
        </Text>
      )}
    </Pressable>
  );
}

type Column = { key: "weightKg" | "reps" | "timeSec" | "note"; label: string };

function columnsFor(entry: SessionEntry): Column[] {
  if (entry.measuredBy === MeasuredBy.Other) return [{ key: "note", label: "NOTE" }];
  const cols: Column[] = [];
  if (entry.targetWeightKg !== null) cols.push({ key: "weightKg", label: "KG" });
  cols.push(entry.measuredBy === MeasuredBy.Reps ? { key: "reps", label: "REPS" } : { key: "timeSec", label: "SEC" });
  return cols;
}

function targetFor(entry: SessionEntry, key: Column["key"]) {
  switch (key) {
    case "weightKg": return entry.targetWeightKg;
    case "reps": return entry.targetReps;
    case "timeSec": return entry.targetTimeSec;
    default: return null;
  }
}

type ExpandedProps = {
  entry: SessionEntry;
  loggedSets: SessionSet[];
  current: boolean;
  restHint?: string;
  onLogSet: (setNumber: number) => void;
  onUnlogSet: (setId: number) => void;
  onOpenSet?: (setNumber: number) => void;
  onCollapse?: () => void;
};

// Expanded card with the set table. `current` = the exercise being worked (volt outline, next set
// loggable); otherwise a reopened completed exercise (all rows checked, last one undoable).
export function ExpandedExerciseCard({
  entry,
  loggedSets,
  current,
  restHint,
  onLogSet,
  onUnlogSet,
  onOpenSet,
  onCollapse,
}: ExpandedProps) {
  const columns = columnsFor(entry);
  const nextSet = current ? loggedSets.length + 1 : 0;

  return (
    <View
      className={`bg-card rounded-[20px] px-3 pt-3 pb-2 ${current ? "border-[1.5px] border-accent" : "border border-line"}`}
    >
      <Pressable
        onPress={onCollapse}
        disabled={!onCollapse}
        accessibilityRole={onCollapse ? "button" : undefined}
        accessibilityLabel={onCollapse ? `Hide ${entry.name} sets` : undefined}
        className="flex-row items-center gap-2.5"
      >
        <View className="w-10 h-10 rounded-[10px] bg-card2" />
        <View className="flex-1">
          <Text className="font-archivo-bold text-base text-text" numberOfLines={1}>{entry.name}</Text>
          <Text className="font-archivo text-xs text-muted mt-px">{describeEntry(entry)}</Text>
        </View>
        {current ? (
          <Text className="font-archivo-bold text-[11px] tracking-[1px] text-accent">CURRENT</Text>
        ) : (
          <Check size={18} color={colors.accent} />
        )}
      </Pressable>

      <View className="flex-row items-center gap-1.5 mt-2.5 px-0.5">
        <Text className="w-9 font-archivo-bold text-[10px] tracking-[0.8px] text-muted">SET</Text>
        {columns.map((c) => (
          <Text key={c.key} className="flex-1 font-archivo-bold text-[10px] tracking-[0.8px] text-muted">
            {c.label}
          </Text>
        ))}
        <View className="w-11" />
      </View>

      {Array.from({ length: entry.targetSets }, (_, i) => {
        const setNumber = i + 1;
        const logged = loggedSets[i];
        const isNext = setNumber === nextSet;
        const isLastLogged = setNumber === loggedSets.length;
        const state = logged ? "done" : isNext ? "next" : "upcoming";
        return (
          <View key={setNumber} className="flex-row items-center gap-1.5 mt-1.5">
            <Text
              className={`w-9 text-center font-archivo-bold text-sm ${isNext ? "text-accent" : "text-muted"}`}
            >
              {setNumber}
            </Text>
            <Pressable
              onPress={onOpenSet ? () => onOpenSet(setNumber) : undefined}
              disabled={!isNext || !onOpenSet}
              accessibilityRole={isNext && onOpenSet ? "button" : undefined}
              accessibilityLabel={isNext && onOpenSet ? `Open set ${setNumber}` : undefined}
              className="flex-1 flex-row gap-1.5 active:opacity-80"
            >
              {columns.map((c) => {
                const value = logged && !logged.skipped ? logged[c.key] : logged ? null : targetFor(entry, c.key);
                return (
                  <View
                    key={c.key}
                    className={`flex-1 h-[38px] rounded-[10px] bg-card2 items-center justify-center border ${isNext ? "border-accent" : "border-transparent"}`}
                  >
                    <Text
                      className={`text-[15px] ${state === "upcoming" || logged?.skipped ? "font-archivo-semibold text-muted" : "font-archivo-bold text-text"}`}
                      style={{ fontVariant: ["tabular-nums"] }}
                      numberOfLines={1}
                    >
                      {value === null || value === undefined ? "–" : String(value)}
                    </Text>
                  </View>
                );
              })}
            </Pressable>
            {logged ? (
              <Pressable
                onPress={() => onUnlogSet(logged.id)}
                disabled={!isLastLogged}
                accessibilityRole="button"
                accessibilityLabel={logged.skipped ? `Undo skipped set ${setNumber}` : `Undo set ${setNumber}`}
                className={`w-11 h-[38px] rounded-[10px] items-center justify-center active:opacity-80 ${logged.skipped ? "bg-card2 border border-line" : "bg-accent"}`}
              >
                {logged.skipped ? (
                  <Text className="font-archivo-bold text-xs text-muted">skip</Text>
                ) : (
                  <Check size={18} color={colors["accent-ink"]} strokeWidth={3} />
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => onLogSet(setNumber)}
                disabled={!isNext}
                accessibilityRole="button"
                accessibilityLabel={`Log set ${setNumber}`}
                className={`w-11 h-[38px] rounded-[10px] border-[1.5px] border-white/[0.18] ${isNext ? "active:opacity-80" : ""}`}
              />
            )}
          </View>
        );
      })}

      {restHint ? (
        <View className="flex-row items-center justify-center mt-2.5 pt-2.5 border-t border-line">
          <Text className="font-archivo-bold text-[13px] text-muted">{restHint}</Text>
        </View>
      ) : null}
    </View>
  );
}
