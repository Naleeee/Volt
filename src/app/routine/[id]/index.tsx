import { router, useLocalSearchParams } from "expo-router";
import { Play, Trash2 } from "lucide-react-native";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import RoutineExerciseRow from "@/components/routines/RoutineExerciseRow";
import BackButton from "@/components/UI/BackButton";
import BottomBar from "@/components/UI/BottomBar";
import Button from "@/components/UI/Button";
import LoadingScreen from "@/components/UI/LoadingScreen";
import Screen from "@/components/UI/Screen";
import { archiveRoutine, useRoutine } from "@/db/queries/routines";
import { useSettings } from "@/db/queries/settings";
import { estimateRoutineSeconds } from "@/lib/estimate";
import { formatEstimatedDuration, formatLastPerformedLine } from "@/lib/format";
import { startWorkout } from "@/lib/session-flow";

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const routine = useRoutine(routineId);
  const settings = useSettings();

  if (!routine) return <LoadingScreen />;

  const count = routine.entries.length;
  const sets = routine.entries.reduce(
    (total, entry) => total + entry.targetSets,
    0,
  );
  const subtitle = [
    `${count} ${count === 1 ? "exercise" : "exercises"}`,
    `${sets} ${sets === 1 ? "set" : "sets"}`,
    formatEstimatedDuration(estimateRoutineSeconds(routine.entries, settings)),
    formatLastPerformedLine(routine.lastPerformedAt),
  ].join(" · ");

  const remove = () =>
    Alert.alert(
      "Delete routine?",
      `"${routine.name}" will be removed. Past sessions are kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            archiveRoutine(routineId);
            router.back();
          },
        },
      ],
    );

  return (
    <Screen>
      <FlatList
        data={routine.entries}
        keyExtractor={(entry, index) => `${entry.exerciseId}-${index}`}
        contentContainerStyle={{ paddingBottom: 120, gap: 8 }}
        ListHeaderComponent={
          <View className="mb-1">
            <View className="flex-row items-center justify-between">
              <BackButton />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/routine/[id]/edit",
                    params: { id },
                  })
                }
                accessibilityRole="button"
                hitSlop={8}
                className="active:opacity-80"
              >
                <Text className="font-archivo-bold text-base text-accent">
                  Edit
                </Text>
              </Pressable>
            </View>
            <Text className="font-archivo-black text-3xl text-text mt-2 tracking-tight">
              {routine.name}
            </Text>
            <Text className="font-archivo text-sm text-muted mt-1 mb-2">
              {subtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => <RoutineExerciseRow entry={item} />}
        ListEmptyComponent={
          <Text className="font-archivo text-sm text-muted text-center mt-6">
            No exercises yet — tap Edit to add some.
          </Text>
        }
        ListFooterComponent={
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            label="Delete routine"
            onPress={remove}
            className="mt-1"
          />
        }
      />
      <BottomBar>
        <Button
          label="Start workout"
          icon={Play}
          iconFill
          onPress={() => startWorkout(routineId)}
        />
      </BottomBar>
    </Screen>
  );
}
