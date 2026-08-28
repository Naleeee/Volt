import RoutineCard from "@/components/routines/RoutineCard";
import ResumeBar from "@/components/sessions/ResumeBar";
import Button from "@/components/UI/Button";
import { useRoutines } from "@/db/queries/routines";
import {
  discardSession,
  getResumePosition,
  useActiveSession,
} from "@/db/queries/sessions";
import { useSessionStore } from "@/lib/session-store";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();
  const routines = useRoutines();
  const active = useActiveSession();
  const { restore, end } = useSessionStore();

  const openRoutine = (id: number) =>
    router.push({ pathname: "/routine/[id]", params: { id: String(id) } });

  const resume = () => {
    if (!active) return;
    const position = getResumePosition(active.id, active.routineId);
    restore(active.id, position?.exerciseIndex ?? 0, position?.setNumber ?? 1);
    router.push({ pathname: "/session/[id]", params: { id: String(active.id) } });
  };

  const discard = () => {
    if (!active) return;
    Alert.alert("Discard session?", `${active.loggedSets} logged sets will be lost.`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          discardSession(active.id);
          end();
        },
      },
    ]);
  };

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
          <View className="gap-4">
            {active ? <ResumeBar session={active} onResume={resume} onDiscard={discard} /> : null}
            <Text className="font-archivo-bold text-[11px] tracking-[1.5px] text-muted mt-2">
              MY ROUTINES
            </Text>
          </View>
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
            inProgress={active?.routineId === item.id}
            onPress={() => openRoutine(item.id)}
            onStart={() => openRoutine(item.id)}
          />
        )}
      />
    </View>
  );
}
