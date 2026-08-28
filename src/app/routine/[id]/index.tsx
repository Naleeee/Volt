import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Play } from "lucide-react-native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RoutineExerciseRow from "@/components/routines/RoutineExerciseRow";
import { colors } from "@/constants/theme";
import { useRoutine } from "@/db/queries/routines";
import { useSettings } from "@/db/queries/settings";
import { estimateRoutineSeconds } from "@/lib/estimate";
import { formatEstimatedDuration, formatLastPerformedLine } from "@/lib/format";
import { toast } from "@/lib/toast";

export default function RoutineDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const routine = useRoutine(routineId);
  const settings = useSettings();

  if (!routine) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const count = routine.entries.length;
  const subtitle = [
    `${count} ${count === 1 ? "exercise" : "exercises"}`,
    formatEstimatedDuration(estimateRoutineSeconds(routine.entries, settings)),
    formatLastPerformedLine(routine.lastPerformedAt),
  ].join(" · ");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <FlatList
        data={routine.entries}
        keyExtractor={(entry, index) => `${entry.exerciseId}-${index}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 6 }}
        ListHeaderComponent={
          <View className="mb-1">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Back"
                className="w-[38px] h-[38px] rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/routine/[id]/edit", params: { id } })
                }
                accessibilityRole="button"
                hitSlop={8}
                className="active:opacity-80"
              >
                <Text className="font-archivo-bold text-[15px] text-accent">Edit</Text>
              </Pressable>
            </View>
            <Text className="font-archivo-black text-[28px] text-text mt-2 tracking-[-0.5px]">
              {routine.name}
            </Text>
            <Text className="font-archivo text-[13px] text-muted mt-1 mb-2">{subtitle}</Text>
          </View>
        }
        renderItem={({ item }) => <RoutineExerciseRow entry={item} />}
        ListEmptyComponent={
          <Text className="font-archivo text-sm text-muted text-center mt-6">
            No exercises yet — tap Edit to add some.
          </Text>
        }
      />
      <View
        className="absolute left-0 right-0 bottom-0 px-5 pt-4 bg-bg"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={() => toast.info("Workout sessions arrive with the session engine.")}
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center gap-[9px] rounded-full bg-accent active:opacity-80"
        >
          <Play size={18} color={colors["accent-ink"]} fill={colors["accent-ink"]} />
          <Text className="font-archivo-bold text-[17px] text-accent-ink">Start workout</Text>
        </Pressable>
      </View>
    </View>
  );
}
