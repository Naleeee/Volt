import SegmentedControl from "@/components/SegmentedControl";
import VTextInput from "@/components/TextInput";
import { MeasuredBy } from "@/lib/enums";
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MEASURED_BY_OPTIONS = [
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const;

export default function NewExercice() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [measuredBy, setMeasuredBy] = useState<MeasuredBy>(MeasuredBy.Reps);
  const [note, setNote] = useState("");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex justify-center items-center flex-row bg-card p-6">
        <Pressable>
          <Text className="font-archivo text-md text-muted">Cancel</Text>
        </Pressable>
        <Text className="font-archivo-bold text-2xl flex-grow text-center text-text">
          New Exercice
        </Text>
        <Pressable>
          <Text className="font-archivo text-md text-accent">Save</Text>
        </Pressable>
      </View>
      <View className="flex-1 px-5 pt-6 gap-[22px]">
        <VTextInput
          value={name}
          onChangeText={setName}
          placeholder="Exercice name"
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
          value={note}
          onChangeText={setNote}
          placeholder="About this exercice..."
          label="Notes"
          multiline
        />
      </View>
    </View>
  );
}
