import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomBar from "@/components/UI/BottomBar";
import Button from "@/components/UI/Button";
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

type Field = RoutineFormValues["entries"][number] & { id: string };

type Props = {
  title: string;
  initial: RoutineFormValues;
  onSave: (values: RoutineFormValues) => unknown;
};

export default function RoutineForm({ title, initial, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: initial,
  });
  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "entries",
  });

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
      <DraggableFlatList<Field>
        data={fields}
        containerStyle={{ flex: 1 }}
        onDragEnd={({ data }) =>
          replace(data.map(({ id: _id, ...entry }) => entry))
        }
        keyExtractor={(field) => field.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingTop: 10,
          paddingBottom: 120,
          gap: 8,
        }}
        ListHeaderComponent={
          <View className="gap-2">
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
            <View className="flex-row items-baseline justify-between mt-4 px-4">
              <Text className="font-archivo-bold text-sm tracking-widest text-muted">
                EXERCISES · {fields.length}
              </Text>
            </View>
            {entriesError ? (
              <Text className="font-archivo text-xs text-danger px-4">
                {entriesError}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({
          item,
          getIndex,
          drag,
          isActive,
        }: RenderItemParams<Field>) => {
          const index = getIndex() ?? 0;
          return (
            <ScaleDecorator>
              <RoutineExerciseCard
                entry={item}
                onChange={(patch) => update(index, { ...item, ...patch })}
                onRemove={() => remove(index)}
                onDrag={drag}
                dragging={isActive}
                error={firstEntryError(errors.entries?.[index])}
              />
            </ScaleDecorator>
          );
        }}
      />
      <BottomBar>
        <View className="flex-row items-center justify-center gap-4 mb-4">
          <Button
            variant="outline"
            label="Add"
            onPress={() => setPickerOpen(true)}
            loading={isSubmitting}
            icon={Plus}
            className="w-28"
          />
          <Button
            label="Save routine"
            onPress={submit}
            loading={isSubmitting}
            className="flex-grow"
          />
        </View>
      </BottomBar>
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
