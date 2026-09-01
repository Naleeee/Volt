import { GripVertical, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import TypeBadge from "@/components/exercises/TypeBadge";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import { colors } from "@/constants/theme";
import type { RoutineEntry } from "@/db/queries/routines";
import { MeasuredBy } from "@/lib/enums";

export type TargetKey =
  | "targetSets"
  | "targetReps"
  | "targetTimeSec"
  | "targetWeightKg";

type Props = {
  entry: RoutineEntry;
  onChange: (patch: Partial<RoutineEntry>) => void;
  onRemove: () => void;
  onDrag?: () => void;
  dragging?: boolean;
  error?: string;
};

export default function RoutineExerciseCard({
  entry,
  onChange,
  onRemove,
  onDrag,
  dragging = false,
  error,
}: Props) {
  const type = MEASURED_BY_STYLES[entry.measuredBy];
  const hasWeight = entry.targetWeightKg !== null;

  return (
    <View
      className={`bg-card border ${dragging ? type.ring : "border-line"} border-l-4 ${type.edge} rounded-2xl p-2.5`}
    >
      <View className="flex-row items-center gap-3">
        {onDrag ? (
          <Pressable
            onLongPress={onDrag}
            delayLongPress={120}
            accessibilityRole="button"
            accessibilityLabel={`Reorder ${entry.name}`}
            hitSlop={8}
            className="-mr-1.5"
          >
            <GripVertical size={18} color={colors.muted} />
          </Pressable>
        ) : null}
        <MediaThumb
          path={entry.mediaPath}
          type={entry.mediaType}
          className="w-12 h-12 rounded-xl"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-archivo-bold text-base text-text shrink"
              numberOfLines={1}
            >
              {entry.name}
            </Text>
            <TypeBadge measuredBy={entry.measuredBy} />
          </View>
          {onDrag ? (
            <Text className="font-archivo text-xs text-muted mt-0.5">
              hold to reorder
            </Text>
          ) : null}
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
          labelClass={type.text}
          value={entry.targetSets}
          onCommit={(v) => onChange({ targetSets: v ?? entry.targetSets })}
        />
        {entry.measuredBy === MeasuredBy.Reps ? (
          <NumberField
            label="REPS"
            labelClass={type.text}
            value={entry.targetReps}
            onCommit={(v) => onChange({ targetReps: v ?? entry.targetReps })}
          />
        ) : null}
        {entry.measuredBy === MeasuredBy.Time ? (
          <NumberField
            label="HOLD"
            labelClass={type.text}
            unit="sec"
            value={entry.targetTimeSec}
            onCommit={(v) =>
              onChange({ targetTimeSec: v ?? entry.targetTimeSec })
            }
          />
        ) : null}
        {entry.measuredBy !== MeasuredBy.Other && hasWeight ? (
          <NumberField
            label="WEIGHT"
            labelClass={type.text}
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
          <Text className="font-archivo-semibold text-xs text-muted">
            + Add weight
          </Text>
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
      <Text
        className={`font-archivo-bold text-xs tracking-widest ${labelClass}`}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline justify-center">
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commit}
          keyboardType={decimal ? "decimal-pad" : "number-pad"}
          returnKeyType="done"
          selectTextOnFocus
          accessibilityLabel={label}
          className="font-archivo-black text-base text-text text-center p-0 min-w-6"
          style={{ fontVariant: ["tabular-nums"], includeFontPadding: false }}
        />
        {unit ? (
          <Text className="font-archivo-bold text-xs text-muted"> {unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
