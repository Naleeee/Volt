import SegmentedControl from "@/components/SegmentedControl";
import VTextInput from "@/components/TextInput";
import { insertExercise, useExercise } from "@/db/queries/exercises";
import { MeasuredBy } from "@/lib/enums";
import { router } from "expo-router";
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MEASURED_BY_OPTIONS = [
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const;

export default function NewExercise(activeExerciseId?: number) {
  const insets = useSafeAreaInsets();
  const exercise = useExercise(activeExerciseId ?? 1); // Example usage of useExercise hook
  const [name, setName] = useState(exercise?.name || "");
  const [measuredBy, setMeasuredBy] = useState<MeasuredBy>(
    exercise?.measuredBy || MeasuredBy.Reps,
  );
  const [notes, setNotes] = useState(exercise?.notes || "");

  const insertExerciseHandler = async (values: {
    name: string;
    measuredBy: MeasuredBy;
    notes: string;
  }) => {
    try {
      await insertExercise(values);
      router.back();
    } catch (error) {
      console.error("Error inserting exercise:", error);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex justify-center items-center flex-row bg-card p-6">
        <Pressable onPress={() => router.back()}>
          <Text className="font-archivo text-md text-muted">Cancel</Text>
        </Pressable>
        <Text className="font-archivo-bold text-2xl flex-grow text-center text-text">
          New Exercise
        </Text>
        <Pressable
          onPress={() => insertExerciseHandler({ name, measuredBy, notes })}
        >
          <Text className="font-archivo text-md text-accent">Save</Text>
        </Pressable>
      </View>
      <View className="flex-1 px-5 pt-6 gap-[22px]">
        <VTextInput
          value={name}
          onChangeText={setName}
          placeholder="Exercise name"
          label="Name"
        />
        <SegmentedControl
          label="Measured by"
          options={MEASURED_BY_OPTIONS}
          value={measuredBy}
          onChange={setMeasuredBy}
          legend={
            '"Other" exercises log a free-form note per set (distance, load, etc.).'
          }
        />
        <VTextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="About this exercise..."
          label="Notes"
          multiline
        />
      </View>
    </View>
  );
}
