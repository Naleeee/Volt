import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";
import { getSettings } from "@/db/queries/settings";

// Importing expo-notifications crashes Expo Go on Android: push support was
// removed there in SDK 53 and the module-load warning became a throw in SDK 55.
const Notifications =
  Platform.OS === "android" && isRunningInExpoGo()
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional load; a static import would evaluate the throwing module
      (require("expo-notifications") as typeof import("expo-notifications"));

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let prepared: Promise<boolean> | undefined;

async function prepare() {
  prepared ??= (async () => {
    if (!Notifications) return false;
    if (Platform.OS === "android")
      await Notifications.setNotificationChannelAsync("rest", {
        name: "Rest timer",
        importance: Notifications.AndroidImportance.HIGH,
      });
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  })();
  return prepared;
}

let queue: Promise<unknown> =
  Notifications?.cancelAllScheduledNotificationsAsync().catch(() => {}) ??
  Promise.resolve();

export function syncRestEndNotification(restEndsAt: number | null) {
  if (!Notifications) return;
  queue = queue
    .then(async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (restEndsAt === null || restEndsAt <= Date.now()) return;
      if (!(await getSettings()).timerSounds) return;
      if (!(await prepare())) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rest over",
          body: "Time for your next set.",
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: restEndsAt,
          channelId: "rest",
        },
      });
    })
    .catch((error) => {
      if (__DEV__) console.error(error);
    });
}
