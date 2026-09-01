import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import TypeBadge from "@/components/exercises/TypeBadge";
import Button from "@/components/UI/Button";
import Screen from "@/components/UI/Screen";
import { colors } from "@/constants/theme";
import {
  unarchiveExercise,
  useArchivedExercises,
} from "@/db/queries/exercises";

export default function ArchivedExercises() {
  const archived = useArchivedExercises();

  return (
    <Screen>
      <FlatList
        data={archived}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          gap: 8,
        }}
        ListHeaderComponent={
          <View className="mb-2">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="w-10 h-10 rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text className="font-archivo-black text-3xl text-text mt-2 tracking-tighter">
              Archived
            </Text>
            <Text className="font-archivo text-sm text-muted mt-1 mb-2">
              Hidden from the library and the routine builder. Past sessions
              keep them.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="font-archivo text-sm text-muted text-center mt-6">
            No archived exercises.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 bg-card border border-line rounded-2xl px-3 py-2.5">
            <View className="flex-1">
              <Text
                className="font-archivo-bold text-base text-text"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <View className="mt-1.5">
                <TypeBadge measuredBy={item.measuredBy} />
              </View>
            </View>
            <Button
              variant="outline"
              size="sm"
              label="Restore"
              onPress={() => void unarchiveExercise(item.id)}
              accessibilityLabel={`Restore ${item.name}`}
            />
          </View>
        )}
      />
    </Screen>
  );
}
