import { X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import TypeBadge from "@/components/exercises/TypeBadge";
import { colors } from "@/constants/theme";
import type { RoutineEntry } from "@/db/queries/routines";
import { MeasuredBy } from "@/lib/enums";

export type TargetKey =
  | "targetSets"
  | "targetReps"
  | "targetTimeSec"
  | "targetWeightKg";

const TYPE_STYLE: Record<MeasuredBy, { edge: string; label: string }> = {
  [MeasuredBy.Reps]: { edge: "border-l-accent", label: "text-accent" },
  [MeasuredBy.Time]: { edge: "border-l-time", label: "text-time" },
  [MeasuredBy.Other]: { edge: "border-l-muted", label: "text-muted" },
};

type Props = {
  entry: RoutineEntry;
  onChange: (patch: Partial<RoutineEntry>) => void;
  onRemove: () => void;
  error?: string;
};

export default function RoutineExerciseCard({ entry, onChange, onRemove, error }: Props) {
  const type = TYPE_STYLE[entry.measuredBy];
  const hasWeight = entry.targetWeightKg !== null;

  return (
    <View className={`bg-card border border-line border-l-[3px] ${type.edge} rounded-[18px] p-2.5`}>
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-[11px] bg-card2" />
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="font-archivo-bold text-[15px] text-text shrink" numberOfLines={1}>
            {entry.name}
          </Text>
          <TypeBadge measuredBy={entry.measuredBy} />
        </View>
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

      <View className="flex-row gap-2 mt-2">
        <NumberField
          label="SETS"
          labelClass={type.label}
          value={entry.targetSets}
          onCommit={(v) => onChange({ targetSets: v ?? entry.targetSets })}
        />
        {entry.measuredBy === MeasuredBy.Reps ? (
          <NumberField
            label="REPS"
            labelClass={type.label}
            value={entry.targetReps}
            onCommit={(v) => onChange({ targetReps: v ?? entry.targetReps })}
          />
        ) : null}
        {entry.measuredBy === MeasuredBy.Time ? (
          <NumberField
            label="HOLD"
            labelClass={type.label}
            unit="sec"
            value={entry.targetTimeSec}
            onCommit={(v) => onChange({ targetTimeSec: v ?? entry.targetTimeSec })}
          />
        ) : null}
        {entry.measuredBy !== MeasuredBy.Other && hasWeight ? (
          <NumberField
            label="WEIGHT"
            labelClass={type.label}
            unit="kg"
            decimal
            value={entry.targetWeightKg}
            onCommit={(v) => onChange({ targetWeightKg: v })}
          />
        ) : null}
      </View>

      {entry.measuredBy !== MeasuredBy.Other && !hasWeight ? (
        <Pressable
          onPress={() => onChange({ targetWeightKg: 0 })}
          accessibilityRole="button"
          hitSlop={8}
          className="self-end mt-1.5 active:opacity-80"
        >
          <Text className="font-archivo-semibold text-xs text-muted">+ Add weight</Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text className="font-archivo text-xs text-danger mt-2">{error}</Text>
      ) : null}
    </View>
  );
}

// Edits stay local while typing and are committed on blur, so the form only re-renders once per field.
function NumberField({
  label,
  labelClass,
  unit,
  value,
  decimal = false,
  onCommit,
}: {
  label: string;
  labelClass: string;
  unit?: string;
  value: number | null;
  decimal?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));

  const commit = () => {
    const trimmed = text.trim().replace(",", ".");
    if (trimmed === "") {
      onCommit(null);
      return;
    }
    const parsed = decimal ? Number(trimmed) : parseInt(trimmed, 10);
    if (Number.isFinite(parsed)) onCommit(parsed);
    else setText(value === null ? "" : String(value));
  };

  return (
    <View className="flex-1 bg-card2 border border-line rounded-xl py-1 items-center">
      <Text className={`font-archivo-bold text-[9px] tracking-[1px] ${labelClass}`}>{label}</Text>
      <View className="flex-row items-baseline justify-center">
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commit}
          keyboardType={decimal ? "decimal-pad" : "number-pad"}
          returnKeyType="done"
          selectTextOnFocus
          accessibilityLabel={label}
          className="font-archivo-black text-[15px] text-text text-center p-0 min-w-[28px]"
          style={{ fontVariant: ["tabular-nums"], includeFontPadding: false }}
        />
        {unit ? (
          <Text className="font-archivo-bold text-[11px] text-muted"> {unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
