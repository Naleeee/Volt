import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FormHeader from "@/components/UI/FormHeader";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import SegmentedControl from "@/components/UI/SegmentedControl";
import VTextInput from "@/components/UI/TextInput";
import {
  exerciseFormSchema,
  type ExerciseFormValues,
} from "@/db/queries/exercises";
import { MeasuredBy } from "@/lib/enums";
import { toast } from "@/lib/toast";
import Button from "../UI/Button";

const MEASURED_BY_OPTIONS = [
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const;

type Props = {
  title: string;
  initial: ExerciseFormValues;
  onSave: (values: ExerciseFormValues) => Promise<unknown>;
};

export default function ExerciseForm({ title, initial, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: initial,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      toast.error("Couldn't save the exercise. Try again.");
    }
  });

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <FormHeader
        title={title}
        onCancel={() => router.back()}
        onSave={submit}
        saving={isSubmitting}
      />
      <View className="flex-1 px-5 pt-6 gap-[22px]">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <VTextInput
              label="Name"
              placeholder="Exercise name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="measuredBy"
          render={({ field: { value, onChange } }) => (
            <SegmentedControl
              label="Measured by"
              options={MEASURED_BY_OPTIONS}
              value={value}
              onChange={onChange}
              legend={
                '"Other" exercises log a free-form note per set (distance, load, etc.).'
              }
              error={errors.measuredBy?.message}
              activeColor={MEASURED_BY_STYLES[value].color}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <VTextInput
              label="Notes"
              optional
              multiline
              placeholder="About this exercise..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.notes?.message}
            />
          )}
        />
      </View>
      <View
        className="flex-1 px-4 flex-grow justify-end"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          variant="secondary"
          label="Archive exercise"
          onPress={submit}
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}
