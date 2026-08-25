import { Stack } from "expo-router";
import "../global.css";
import { useFonts } from "expo-font";
import { Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/db/client";
import migrations from "@/db/drizzle/migrations";

// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Archivo-Regular": require("../assets/static/Archivo-Regular.ttf"),
    "Archivo-Medium": require("../assets/static/Archivo-Medium.ttf"),
    "Archivo-SemiBold": require("../assets/static/Archivo-SemiBold.ttf"),
    "Archivo-Bold": require("../assets/static/Archivo-Bold.ttf"),
    "Archivo-Black": require("../assets/static/Archivo-Black.ttf"),
  });

  const { success: migrated, error: migrationError } = useMigrations(db, migrations);

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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//
//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen
//           name="modal"
//           options={{ presentation: "modal", title: "Modal" }}
//         />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }
