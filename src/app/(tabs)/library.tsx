import ExerciseCard from "@/components/exercises/ExerciseCard";
import FilterChips from "@/components/UI/FilterChips";
import IconButton from "@/components/UI/IconButton";
import SearchBar from "@/components/UI/SearchBar";
import { router } from "expo-router";
import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react-native";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExercises } from "@/db/queries/exercises";
import { MEASURED_BY_FILTERS, MeasuredByFilter } from "@/constants/exercises";
import { colors } from "@/constants/theme";
import Button from "@/components/UI/Button";

export default function Index() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MeasuredByFilter>("all");
  const exercises = useExercises();

  const needle = query.trim().toLowerCase();
  const visible = exercises.filter(
    (e) =>
      (filter === "all" || e.measuredBy === filter) &&
      e.name.toLowerCase().includes(needle),
  );

  return (
    <View
      className="flex-1 bg-bg px-4 gap-4"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex items-end flex-row gap-3">
        <Text className="font-archivo-black text-4xl text-text">Exercises</Text>
        <Text className="font-archivo text-md text-muted">
          {visible.length}
        </Text>
      </View>
      {exercises.length === 0 ? (
        <>
          <View className="gap-3">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises"
            />
            <FilterChips
              options={MEASURED_BY_FILTERS}
              value={filter}
              onChange={setFilter}
            />
          </View>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.name}
            numColumns={2}
            columnWrapperStyle={{ gap: 16 }}
            contentContainerStyle={{ paddingBottom: 96, gap: 16 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="font-archivo text-sm text-muted text-center mt-8">
                No exercises match.
              </Text>
            }
            renderItem={({ item }) => (
              <ExerciseCard
                exerciseId={item.id}
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
        </>
      ) : (
        <View className="flex-1 justify-center items-center gap-4">
          <View className="w-24 h-24 rounded-full bg-card border border-muted/30 justify-center items-center">
            <LayoutGrid color={colors.accent} size={32} />
          </View>
          <Text className="font-archivo-bold text-lg text-text">
            No exercises yet
          </Text>
          <Text className="font-archivo text-sm text-muted text-center w-2/3 self-center">
            Add each exercise once, with a photo or GIF of the movement, then
            reuse it across every routine.
          </Text>
          <Button
            variant="primary"
            label="New exercise"
            onPress={() => router.push("/exercise/new")}
          />
        </View>
      )}
    </View>
  );
}
