import RoutineCard from "@/components/routines/RoutineCard";
import Button from "@/components/UI/Button";
import { useRoutines } from "@/db/queries/routines";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
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
          <Button
            variant="dashed"
            icon={Plus}
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
