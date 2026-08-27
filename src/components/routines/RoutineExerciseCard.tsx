import { Minus, Plus, X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import type { RoutineEntry } from "@/db/queries/routines";
import { MeasuredBy } from "@/lib/enums";
import { formatWeight } from "@/lib/format";

export type TargetKey =
  | "targetSets"
  | "targetReps"
  | "targetTimeSec"
  | "targetWeightKg";

const TARGETS: Record<
  TargetKey,
  { step: number; min: number; label: (v: number) => string }
> = {
  targetSets: { step: 1, min: 1, label: (v) => `${v} ${v === 1 ? "set" : "sets"}` },
  targetReps: { step: 1, min: 1, label: (v) => `${v} reps` },
  targetTimeSec: { step: 5, min: 5, label: (v) => `${v} sec` },
  targetWeightKg: { step: 2.5, min: 0, label: formatWeight },
};

type Props = {
  entry: RoutineEntry;
  activeTarget: TargetKey | null;
  onToggleTarget: (key: TargetKey) => void;
  onChange: (patch: Partial<RoutineEntry>) => void;
  onRemove: () => void;
  error?: string;
};

export default function RoutineExerciseCard({
  entry,
  activeTarget,
  onToggleTarget,
  onChange,
  onRemove,
  error,
}: Props) {
  const keys: TargetKey[] = ["targetSets"];
  if (entry.measuredBy === MeasuredBy.Reps) keys.push("targetReps");
  if (entry.measuredBy === MeasuredBy.Time) keys.push("targetTimeSec");
  if (entry.measuredBy !== MeasuredBy.Other) keys.push("targetWeightKg");

  const step = (key: TargetKey, direction: 1 | -1) => {
    const { step, min } = TARGETS[key];
    const current = entry[key];
    // Stepping weight below 0 clears it — the pill goes back to "+ weight".
    if (key === "targetWeightKg" && current !== null && current <= min && direction < 0) {
      onChange({ targetWeightKg: null });
      return;
    }
    const next = Math.max(min, (current ?? 0) + step * direction);
    onChange({ [key]: next });
  };

  return (
    <View className="bg-card border border-line rounded-[18px] px-3 py-2.5">
      <View className="flex-row items-center gap-2.5">
        <View className="w-10 h-10 rounded-[10px] bg-card2" />
        <Text className="flex-1 font-archivo-bold text-[15px] text-text" numberOfLines={1}>
          {entry.name}
        </Text>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${entry.name}`}
          hitSlop={8}
          className="w-7 h-7 rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
        >
          <X size={14} color={colors.muted} />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-2.5">
        {keys.map((key) => {
          const value = entry[key];
          const active = activeTarget === key;
          const empty = value === null;
          return (
            <Pressable
              key={key}
              onPress={() => onToggleTarget(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`rounded-[10px] px-3 py-2 border ${
                active
                  ? "bg-card2 border-accent"
                  : empty
                    ? "border-dashed border-white/[0.18]"
                    : "bg-card2 border-line"
              }`}
            >
              <Text
                className={`font-archivo-bold text-[13px] ${
                  active ? "text-accent" : empty ? "text-muted" : "text-text"
                }`}
              >
                {empty ? "+ weight" : TARGETS[key].label(value)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTarget ? (
        <View className="flex-row items-center justify-between mt-2.5 px-1">
          <StepButton icon={Minus} onPress={() => step(activeTarget, -1)} label="Decrease" />
          <Text className="font-archivo-bold text-base text-text">
            {entry[activeTarget] === null
              ? "No weight"
              : TARGETS[activeTarget].label(entry[activeTarget] as number)}
          </Text>
          <StepButton icon={Plus} onPress={() => step(activeTarget, 1)} label="Increase" />
        </View>
      ) : null}

      {error ? (
        <Text className="font-archivo text-xs text-danger mt-2">{error}</Text>
      ) : null}
    </View>
  );
}

function StepButton({
  icon: Icon,
  onPress,
  label,
}: {
  icon: typeof Minus;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-11 h-11 rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
    >
      <Icon size={18} color={colors.text} />
    </Pressable>
  );
}
