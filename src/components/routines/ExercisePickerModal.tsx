import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TypeBadge from "@/components/exercises/TypeBadge";
import SearchBar from "@/components/UI/SearchBar";
import { useExercises } from "@/db/queries/exercises";
import type { Exercise } from "@/db/schema";
import FilterChips from "../UI/FilterChips";
import { MEASURED_BY_FILTERS, MeasuredByFilter } from "@/constants/exercises";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
};

export default function ExercisePickerModal({
  visible,
  onClose,
  onPick,
}: Props) {
  const insets = useSafeAreaInsets();
  const exercises = useExercises();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MeasuredByFilter>("all");

  const needle = query.trim().toLowerCase();
  const visibleExercises = exercises.filter(
    (e) =>
      (filter === "all" || e.measuredBy === filter) &&
      e.name.toLowerCase().includes(needle),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-archivo-bold text-3xl text-text">
            Add exercise
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text className="font-archivo-semibold text-base text-muted">
              Close
            </Text>
          </Pressable>
        </View>
        <View className="flex gap-4 px-5">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            autoFocus
          />
          <FilterChips
            options={MEASURED_BY_FILTERS}
            value={filter}
            onChange={setFilter}
          />
        </View>
        <FlatList
          data={visibleExercises}
          keyExtractor={(e) => String(e.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <Text className="font-archivo text-sm text-muted text-center mt-8">
              No exercises match.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              className="flex-row items-center gap-3 px-5 py-3.5 border-b border-line active:bg-card"
            >
              <Text className="flex-1 font-archivo-bold text-[15px] text-text">
                {item.name}
              </Text>
              <TypeBadge measuredBy={item.measuredBy} />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
