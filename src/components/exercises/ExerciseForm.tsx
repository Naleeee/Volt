import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FieldLabel from "@/components/UI/FieldLabel";
import FormHeader from "@/components/UI/FormHeader";
import MediaThumb from "@/components/UI/MediaThumb";
import { MEASURED_BY_STYLES } from "@/constants/exercises";
import SegmentedControl from "@/components/UI/SegmentedControl";
import VTextInput from "@/components/UI/TextInput";
import {
  exerciseFormSchema,
  type ExerciseFormValues,
} from "@/db/queries/exercises";
import { MeasuredBy } from "@/lib/enums";
import { pickMedia } from "@/lib/media";
import { toast } from "@/lib/toast";
import Button from "../UI/Button";

const MEASURED_BY_OPTIONS = [
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const;

type ExerciseFormProps = {
  title: string;
  initial: ExerciseFormValues;
  onSave: (values: ExerciseFormValues) => Promise<unknown>;
  onArchive?: () => Promise<unknown>;
};

export default function ExerciseForm({
  title,
  initial,
  onSave,
  onArchive,
}: ExerciseFormProps) {
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: initial,
  });
  const mediaPath = watch("mediaPath");
  const mediaType = watch("mediaType");

  const pick = async () => {
    const picked = await pickMedia();
    if (!picked) return;
    setValue("mediaPath", picked.uri, { shouldDirty: true });
    setValue("mediaType", picked.type, { shouldDirty: true });
  };

  const removeMedia = () => {
    setValue("mediaPath", null, { shouldDirty: true });
    setValue("mediaType", null, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      toast.error("Couldn't save the exercise. Try again.");
    }
  });

  const archive = async () => {
    if (!onArchive) return;
    try {
      await onArchive();
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      toast.error("Couldn't archive the exercise. Try again.");
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <FormHeader
        title={title}
        onCancel={() => router.back()}
        onSave={submit}
        saving={isSubmitting}
      />
      <View className="flex-1 px-5 pt-6 gap-6">
        <View>
          <FieldLabel label="Photo / GIF" />
          <Pressable
            onPress={pick}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={
              mediaPath ? "Replace photo or GIF" : "Add photo or GIF"
            }
            className="active:opacity-80"
          >
            {mediaPath ? (
              <MediaThumb
                path={mediaPath}
                type={mediaType}
                className="h-48 rounded-3xl"
              />
            ) : (
              <View className="h-48 rounded-3xl bg-card2 border-2 border-dashed border-white/20 items-center justify-center px-6">
                <Text className="font-archivo-semibold text-sm text-muted text-center">
                  Add a photo or GIF of the movement
                </Text>
              </View>
            )}
          </Pressable>
          <View className="flex-row items-center justify-between mt-2 px-4">
            <Text className="font-archivo text-xs text-muted">
              GIFs loop in the session view.
            </Text>
            {mediaPath ? (
              <Pressable
                onPress={removeMedia}
                disabled={isSubmitting}
                accessibilityRole="button"
                hitSlop={8}
                className="active:opacity-80"
              >
                <Text className="font-archivo-bold text-xs text-muted">
                  Remove
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
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
      {onArchive ? (
        <View
          className="flex-1 px-4 flex-grow justify-end"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Button
            variant="secondary"
            label="Archive exercise"
            onPress={() => void archive()}
            disabled={isSubmitting}
          />
        </View>
      ) : null}
    </View>
  );
}
