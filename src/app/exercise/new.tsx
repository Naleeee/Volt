import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SegmentedControl from "@/components/UI/SegmentedControl";
import VTextInput from "@/components/UI/TextInput";
import { colors } from "@/constants/theme";
import {
  EMPTY_EXERCISE,
  exerciseFormSchema,
  insertExercise,
  type ExerciseFormValues,
} from "@/db/queries/exercises";
import { MeasuredBy } from "@/lib/enums";
import { toast } from "@/lib/toast";

const MEASURED_BY_OPTIONS = [
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const;

export default function NewExercise() {
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: EMPTY_EXERCISE,
  });

  const onSave = handleSubmit(async (values) => {
    try {
      await insertExercise(values);
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      toast.error("Couldn't save the exercise. Try again.");
    }
  });

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex justify-center items-center flex-row bg-card p-6">
        <Pressable
          className="w-[60px]"
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text className="font-archivo text-md text-muted">Cancel</Text>
        </Pressable>
        <Text className="font-archivo-bold text-2xl flex-grow text-center text-text">
          New Exercise
        </Text>
        <Pressable
          className="w-[60px] items-end"
          onPress={onSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text className="font-archivo text-md text-accent">Save</Text>
          )}
        </Pressable>
      </View>
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
    </View>
  );
}
