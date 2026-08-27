import { Stack } from "expo-router";
import Toast from "@/components/UI/Toast";
import "../../global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db, sqlite } from "@/db/client";
import migrations from "@/db/drizzle/migrations";
import { seedIfEmpty } from "@/db/seed";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

import "react-native-reanimated";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Archivo-Regular": require("../../assets/static/Archivo-Regular.ttf"),
    "Archivo-Medium": require("../../assets/static/Archivo-Medium.ttf"),
    "Archivo-SemiBold": require("../../assets/static/Archivo-SemiBold.ttf"),
    "Archivo-Bold": require("../../assets/static/Archivo-Bold.ttf"),
    "Archivo-Black": require("../../assets/static/Archivo-Black.ttf"),
  });

  const { success: migrated, error: migrationError } = useMigrations(
    db,
    migrations,
  );
  useDrizzleStudio(sqlite);

  useEffect(() => {
    if (migrated && __DEV__) void seedIfEmpty().catch(console.error);
  }, [migrated]);

  if (migrationError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text className="text-text text-lg">Database migration failed</Text>
        <Text className="text-muted mt-2">{migrationError.message}</Text>
      </View>
    );
  }

  if ((!loaded && !error) || !migrated) {
    return null;
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};
