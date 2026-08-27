import ExerciseCard from "@/components/exercises/ExerciseCard";
import { MeasuredBy } from "@/lib/enums";
import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
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

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-3xl px-4 text-text">
        Exercises
      </Text>
      <Pressable
        className="bg-accent rounded-lg p-4 m-4"
        onPress={() => {
          router.push("/exercise/new");
        }}
      >
        <Text className="text-text-inverted font-archivo-bold text-lg">
          New Exercise
        </Text>
      </Pressable>
      <FlatList
        data={EXAMPLES}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}
        renderItem={({ item }) => (
          <ExerciseCard exerciseName={item.name} exerciseType={item.measuredBy} />
        )}
      />
    </View>
  );
}
