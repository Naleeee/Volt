import RoutineCard from "@/components/routines/RoutineCard";
import RoutinesStatsPill from "@/components/routines/RoutinesStatsPill";
import ResumeBar from "@/components/sessions/ResumeBar";
import Button from "@/components/UI/Button";
import { colors } from "@/constants/theme";
import { useRoutines } from "@/db/queries/routines";
import {
  discardSession,
  getResumePosition,
  useActiveSession,
  useWeekStats,
} from "@/db/queries/sessions";
import { useSessionStore } from "@/lib/session-store";
import { format } from "date-fns";
import { router } from "expo-router";
import { Plus, Zap } from "lucide-react-native";
import { Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();
  const routines = useRoutines();
  const active = useActiveSession();
  const stats = useWeekStats();
  const { restore, end } = useSessionStore();

  const openRoutine = (id: number) =>
    router.push({ pathname: "/routine/[id]", params: { id: String(id) } });

  const resume = () => {
    if (!active) return;
    const position = getResumePosition(active.id, active.routineId);
    restore(active.id, position?.exerciseIndex ?? 0, position?.setNumber ?? 1);
    router.push({
      pathname: "/session/[id]",
      params: { id: String(active.id) },
    });
  };

  const discard = () => {
    if (!active) return;
    Alert.alert(
      "Discard session?",
      `${active.loggedSets} logged sets will be lost.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            discardSession(active.id);
            end();
          },
        },
      ],
    );
  };

  return (
    <View
      className="flex-1 bg-bg px-4 gap-4"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex flex-row items-end justify-between mt-2">
        <View className="flex flex-col gap-2">
          <Text className="font-archivo-bold text-xs tracking-[1.5px] text-muted uppercase mt-4">
            {format(new Date(), "EEEE d MMM")}
          </Text>
          <Text className="font-archivo-black text-4xl text-text">
            Workouts
          </Text>
        </View>
        <View className="flex flex-row justify-center items-center gap-2 bg-card rounded-3xl p-3 py-2 border border-muted">
          <Zap color={colors.accent} size={14} fill={colors.accent} />
          <Text className="font-archivo text-md text-text">{stats.streakWeeks} wk</Text>
        </View>
      </View>

      <RoutinesStatsPill
        workouts={stats.workouts}
        trainedSec={stats.trainedSec}
        setsLogged={stats.setsLogged}
      />

      <FlatList
        data={routines}
        keyExtractor={(routine) => String(routine.id)}
        contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
        ListHeaderComponent={
          <View className="gap-4">
            {active ? (
              <ResumeBar
                session={active}
                onResume={resume}
                onDiscard={discard}
              />
            ) : null}
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
