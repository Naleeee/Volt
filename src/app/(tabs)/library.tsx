import ExerciseCard from "@/components/exercises/ExerciseCard";
import FilterChips from "@/components/UI/FilterChips";
import IconButton from "@/components/UI/IconButton";
import SearchBar from "@/components/UI/SearchBar";
import { MeasuredBy } from "@/lib/enums";
import { router } from "expo-router";
import { useState } from "react";
import { Plus } from "lucide-react-native";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXAMPLES = [
  { name: "Bench Press", measuredBy: MeasuredBy.Reps },
  { name: "Plank", measuredBy: MeasuredBy.Time },
  { name: "Farmer's Carry", measuredBy: MeasuredBy.Other },
  { name: "Back Squat", measuredBy: MeasuredBy.Reps },
  { name: "Wall Sit", measuredBy: MeasuredBy.Time },
  { name: "Pull-Up", measuredBy: MeasuredBy.Reps },
  { name: "Push-Up", measuredBy: MeasuredBy.Reps },
  { name: "Dead Hang", measuredBy: MeasuredBy.Time },
];

type Filter = "all" | MeasuredBy;

const FILTERS = [
  { value: "all", label: "All" },
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const satisfies readonly { value: Filter; label: string }[];

export default function Index() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const needle = query.trim().toLowerCase();
  const visible = EXAMPLES.filter(
    (e) =>
      (filter === "all" || e.measuredBy === filter) &&
      e.name.toLowerCase().includes(needle),
  );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-5xl px-4 text-text">
        Exercises
      </Text>
      <View className="px-4 pt-4 gap-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
        />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="font-archivo text-sm text-muted text-center mt-8">
            No exercises match.
          </Text>
        }
        renderItem={({ item }) => (
          <ExerciseCard
            exerciseName={item.name}
            exerciseType={item.measuredBy}
          />
        )}
      />
      <IconButton
        icon={Plus}
        accessibilityLabel="New exercise"
        onPress={() => router.push("/exercise/new")}
        className="absolute right-5 bottom-6"
      />
    </View>
  );
}
