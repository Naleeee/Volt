import RoutineCard from "@/components/routines/RoutineCard";
import DashedButton from "@/components/UI/DashedButton";
import { useRoutines } from "@/db/queries/routines";
import { router } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();
  const routines = useRoutines();

  const openRoutine = (id: number) =>
    router.push({ pathname: "/routine/[id]", params: { id: String(id) } });

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="font-archivo-bold text-3xl px-4 text-text">
        Routines
      </Text>
      <FlatList
        data={routines}
        keyExtractor={(routine) => String(routine.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
        ListHeaderComponent={
          <Text className="font-archivo-bold text-[11px] tracking-[1.5px] text-muted mt-2">
            MY ROUTINES
          </Text>
        }
        ListFooterComponent={
          <DashedButton
            label="New routine"
            onPress={() => router.push("/routine/new")}
          />
        }
        renderItem={({ item }) => (
          <RoutineCard
            name={item.name}
            exerciseCount={item.exerciseCount}
            lastPerformedAt={item.lastPerformedAt}
            onPress={() => openRoutine(item.id)}
            onStart={() => openRoutine(item.id)}
          />
        )}
      />
    </View>
  );
}
