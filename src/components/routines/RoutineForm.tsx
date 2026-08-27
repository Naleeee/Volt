import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashedButton from "@/components/UI/DashedButton";
import FormHeader from "@/components/UI/FormHeader";
import VTextInput from "@/components/UI/TextInput";
import {
  defaultEntry,
  routineFormSchema,
  type RoutineFormValues,
} from "@/db/queries/routines";
import { toast } from "@/lib/toast";
import ExercisePickerModal from "./ExercisePickerModal";
import RoutineExerciseCard, { type TargetKey } from "./RoutineExerciseCard";

type Props = {
  title: string;
  initial: RoutineFormValues;
  onSave: (values: RoutineFormValues) => unknown;
};

export default function RoutineForm({ title, initial, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<{ index: number; key: TargetKey } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: initial,
  });
  const { fields, append, remove, update } = useFieldArray({ control, name: "entries" });

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      toast.error("Couldn't save the routine. Try again.");
    }
  });

  const entriesError = errors.entries?.root?.message ?? errors.entries?.message;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <FormHeader
        title={title}
        onCancel={() => router.back()}
        onSave={submit}
        saving={isSubmitting}
      />
      <FlatList
        data={fields}
        keyExtractor={(field) => field.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 8 }}
        ListHeaderComponent={
          <View className="gap-2 mb-2">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <VTextInput
                  label="Name"
                  placeholder="Push Day"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  returnKeyType="done"
                />
              )}
            />
            <Text className="font-archivo-bold text-sm tracking-[1.5px] text-muted mt-4 px-4">
              EXERCISES · {fields.length}
            </Text>
            <Text className="font-archivo text-xs text-muted px-4">
              Tap a target pill to edit it. The same exercise can appear more than once.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <RoutineExerciseCard
            entry={item}
            activeTarget={activeTarget?.index === index ? activeTarget.key : null}
            onToggleTarget={(key) =>
              setActiveTarget((current) =>
                current?.index === index && current.key === key ? null : { index, key },
              )
            }
            onChange={(patch) => update(index, { ...item, ...patch })}
            onRemove={() => {
              remove(index);
              setActiveTarget(null);
            }}
            error={firstEntryError(errors.entries?.[index])}
          />
        )}
        ListFooterComponent={
          <View className="gap-2 mt-2">
            <DashedButton label="Add exercise from library" onPress={() => setPickerOpen(true)} />
            {entriesError ? (
              <Text className="font-archivo text-xs text-danger px-4">{entriesError}</Text>
            ) : null}
          </View>
        }
      />
      <View
        className="absolute left-0 right-0 bottom-0 px-5 pt-4 bg-bg"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={submit}
          disabled={isSubmitting}
          accessibilityRole="button"
          className="h-14 rounded-full bg-accent items-center justify-center active:opacity-80"
        >
          <Text className="font-archivo-bold text-[17px] text-accent-ink">Save routine</Text>
        </Pressable>
      </View>
      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exercise) => {
          append(defaultEntry(exercise));
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

function firstEntryError(
  entryErrors: Partial<Record<TargetKey, { message?: string }>> | undefined,
) {
  if (!entryErrors) return undefined;
  return (
    entryErrors.targetSets?.message ??
    entryErrors.targetReps?.message ??
    entryErrors.targetTimeSec?.message ??
    entryErrors.targetWeightKg?.message
  );
}
