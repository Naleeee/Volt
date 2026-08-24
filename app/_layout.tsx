import { Stack } from "expo-router";
import "../global.css";
import { useFonts } from "expo-font";

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

  if (!loaded && !error) {
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
