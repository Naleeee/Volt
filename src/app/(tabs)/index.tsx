import RoutineCard from "@/components/routines/RoutineCard";
import RoutinesStatsPill from "@/components/routines/RoutinesStatsPill";
import ResumeBar from "@/components/sessions/ResumeBar";
import Button from "@/components/UI/Button";
import EmptyState from "@/components/UI/EmptyState";
import Screen from "@/components/UI/Screen";
import { colors } from "@/constants/theme";
import { useRoutines } from "@/db/queries/routines";
import {
  discardSession,
  getResumePosition,
  useActiveSession,
  useWeekStats,
} from "@/db/queries/sessions";
import { startWorkout } from "@/lib/session-flow";
import { useSessionStore } from "@/lib/session-store";
import { router } from "expo-router";
import { Plus, Zap, Dumbbell } from "lucide-react-native";
import { Alert, FlatList, Text, View } from "react-native";

export default function Index() {
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
    <Screen>
      <View className="flex flex-row items-end justify-between">
        <Text className="font-archivo-black text-4xl text-text">Workouts</Text>
        {routines.length !== 0 && (
          <View className="flex flex-row justify-center items-center gap-2 bg-card rounded-3xl p-3 py-2 border border-muted">
            <Zap color={colors.accent} size={14} fill={colors.accent} />
            <Text className="font-archivo text-base text-text">
              {`${stats.streakWeeks} week${stats.streakWeeks === 1 ? "" : "s"}`}
            </Text>
          </View>
        )}
      </View>

      {routines.length !== 0 && (
        <RoutinesStatsPill
          workouts={stats.workouts}
          trainedSec={stats.trainedSec}
          setsLogged={stats.setsLogged}
        />
      )}

      {routines.length !== 0 ? (
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
              <Text className="font-archivo-bold text-xs tracking-widest text-muted mt-2">
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
              onStart={() => startWorkout(item.id)}
            />
          )}
        />
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No routines yet"
          description="Create a routine to start tracking your workouts and progress."
        >
          <Button
            variant="primary"
            label="New routine"
            onPress={() => router.push("/routine/new")}
          />
          <Button
            variant="outline"
            label="Browse exercises"
            onPress={() => router.push("/library")}
          />
        </EmptyState>
      )}
    </Screen>
  );
}
