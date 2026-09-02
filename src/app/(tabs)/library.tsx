import ExerciseCard from "@/components/exercises/ExerciseCard";
import FilterChips from "@/components/UI/FilterChips";
import IconButton from "@/components/UI/IconButton";
import SearchBar from "@/components/UI/SearchBar";
import { router } from "expo-router";
import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { useArchivedExercises, useExercises } from "@/db/queries/exercises";
import { MEASURED_BY_FILTERS, MeasuredByFilter } from "@/constants/exercises";
import { filterExercises } from "@/lib/filter-exercises";
import Button from "@/components/UI/Button";
import EmptyState from "@/components/UI/EmptyState";
import Screen from "@/components/UI/Screen";

export default function Index() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MeasuredByFilter>("all");
  const exercises = useExercises();
  const archived = useArchivedExercises();

  const visible = filterExercises(exercises, query, filter);

  return (
    <Screen>
      <View className="flex items-end flex-row gap-3">
        <Text className="font-archivo-black text-4xl text-text">Exercises</Text>
        <Text className="font-archivo text-base text-muted">
          {visible.length}
        </Text>
      </View>
      {exercises.length !== 0 ? (
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
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={{ gap: 16 }}
            contentContainerStyle={{ paddingBottom: 96, gap: 16 }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              archived.length > 0 ? (
                <Pressable
                  onPress={() => router.push("/exercise/archived")}
                  accessibilityRole="button"
                  hitSlop={8}
                  className="py-2 active:opacity-80"
                >
                  <Text className="font-archivo-bold text-sm text-muted text-center">
                    Archived ({archived.length})
                  </Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              <Text className="font-archivo text-sm text-muted text-center mt-8">
                No exercises match.
              </Text>
            }
            renderItem={({ item }) => (
              <ExerciseCard
                exerciseId={item.id}
                exerciseName={item.name}
                mediaPath={item.mediaPath}
                mediaType={item.mediaType}
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
        <EmptyState
          icon={LayoutGrid}
          title="No exercises yet"
          description="Add each exercise once, with a photo or GIF of the movement, then reuse it across every routine."
        >
          <Button
            variant="primary"
            label="New exercise"
            onPress={() => router.push("/exercise/new")}
          />
          {archived.length > 0 ? (
            <Pressable
              onPress={() => router.push("/exercise/archived")}
              accessibilityRole="button"
              hitSlop={8}
              className="active:opacity-80"
            >
              <Text className="font-archivo-bold text-sm text-accent">
                View archived ({archived.length})
              </Text>
            </Pressable>
          ) : null}
        </EmptyState>
      )}
    </Screen>
  );
}
