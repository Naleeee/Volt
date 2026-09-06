import { Check } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TypeBadge from "@/components/exercises/TypeBadge";
import BottomBar from "@/components/UI/BottomBar";
import Button from "@/components/UI/Button";
import FilterChips from "@/components/UI/FilterChips";
import MediaThumb from "@/components/UI/MediaThumb";
import SearchBar from "@/components/UI/SearchBar";
import { MEASURED_BY_FILTERS, MeasuredByFilter } from "@/constants/exercises";
import { colors } from "@/constants/theme";
import { useExercises } from "@/db/queries/exercises";
import type { Exercise } from "@/db/schema";
import { filterExercises } from "@/lib/filter-exercises";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
};

export default function ExercisePickerModal({ visible, onClose, onAdd }: Props) {
  const insets = useSafeAreaInsets();
  const exercises = useExercises();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MeasuredByFilter>("all");
  const [selected, setSelected] = useState<Exercise[]>([]);

  const visibleExercises = filterExercises(exercises, query, filter);
  const count = selected.length;

  const toggle = (exercise: Exercise) =>
    setSelected((prev) =>
      prev.some((e) => e.id === exercise.id)
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise],
    );

  const close = () => {
    setSelected([]);
    onClose();
  };

  const add = () => {
    onAdd(selected);
    setSelected([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-5 py-4">
          <Pressable onPress={close} hitSlop={8} className="w-16">
            <Text className="font-archivo-semibold text-base text-muted">
              Cancel
            </Text>
          </Pressable>
          <Text className="flex-1 font-archivo-bold text-base text-text text-center">
            Add exercises
          </Text>
          <View className="w-16" />
        </View>
        <View className="gap-3 px-5">
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
          data={visibleExercises}
          keyExtractor={(e) => String(e.id)}
          extraData={selected}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 120,
            gap: 8,
          }}
          ListEmptyComponent={
            <Text className="font-archivo text-sm text-muted text-center mt-8">
              No exercises match.
            </Text>
          }
          renderItem={({ item }) => (
            <PickerRow
              exercise={item}
              selected={selected.some((e) => e.id === item.id)}
              onPress={() => toggle(item)}
            />
          )}
        />
        <BottomBar>
          <Button
            label={
              count === 0
                ? "Add exercises"
                : `Add ${count} ${count === 1 ? "exercise" : "exercises"}`
            }
            onPress={add}
            disabled={count === 0}
          />
        </BottomBar>
      </View>
    </Modal>
  );
}

function PickerRow({
  exercise,
  selected,
  onPress,
}: {
  exercise: Exercise;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className={`flex-row items-center gap-3 bg-card border rounded-2xl py-2 pl-2.5 pr-3.5 active:opacity-80 ${selected ? "border-accent" : "border-line"}`}
    >
      <MediaThumb
        path={exercise.mediaPath}
        type={exercise.mediaType}
        className="w-12 h-12 rounded-xl"
      />
      <View className="flex-1 gap-1">
        <Text className="font-archivo-bold text-base text-text" numberOfLines={1}>
          {exercise.name}
        </Text>
        <TypeBadge measuredBy={exercise.measuredBy} />
      </View>
      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${selected ? "bg-accent" : "border-2 border-line"}`}
      >
        {selected ? (
          <Check size={14} color={colors["accent-ink"]} strokeWidth={2.5} />
        ) : null}
      </View>
    </Pressable>
  );
}
