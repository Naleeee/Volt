import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSettings } from "@/db/queries/settings";

Notifications.setNotificationHandler({
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
  Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

export function syncRestEndNotification(restEndsAt: number | null) {
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
