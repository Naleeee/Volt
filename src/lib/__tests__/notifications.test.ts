import type { Notification, NotificationPermissionsStatus } from "expo-notifications";
import type { Settings } from "@/db/queries/settings";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("id")),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("@/db/queries/settings", () => ({ getSettings: jest.fn() }));
jest.mock("expo", () => ({ isRunningInExpoGo: jest.fn(() => false) }));

const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain }) as NotificationPermissionsStatus;

const settings = (timerSounds: boolean): Settings => ({
  restBetweenSetsSec: 45,
  restBetweenExercisesSec: 90,
  autostartRestTimer: true,
  timerSounds,
  keepAwake: true,
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

type Env = {
  timerSounds?: boolean;
  current?: NotificationPermissionsStatus;
  platform?: "ios" | "android";
  expoGo?: boolean;
  bootFails?: boolean;
};

// The module memoises the permission check, so each test gets a fresh copy.
function load({
  timerSounds = true,
  current = permission(true),
  platform = "ios",
  expoGo = false,
  bootFails = false,
}: Env = {}) {
  jest.resetModules();
  const { Platform } = jest.requireActual<typeof import("react-native")>("react-native");
  jest.replaceProperty(Platform, "OS", platform);
  jest.mocked(jest.requireMock<typeof import("expo")>("expo")).isRunningInExpoGo.mockReturnValue(expoGo);
  const Notifications = jest.mocked(
    jest.requireMock<typeof import("expo-notifications")>("expo-notifications"),
  );
  const { getSettings } = jest.mocked(
    jest.requireMock<typeof import("@/db/queries/settings")>("@/db/queries/settings"),
  );
  getSettings.mockResolvedValue(settings(timerSounds));
  Notifications.getPermissionsAsync.mockResolvedValue(current);
  if (bootFails)
    Notifications.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error("boot"));
  const { syncRestEndNotification } =
    jest.requireActual<typeof import("@/lib/notifications")>("@/lib/notifications");
  return { Notifications, getSettings, sync: syncRestEndNotification };
}

afterEach(() => jest.restoreAllMocks());

describe("notification handler", () => {
  it("suppresses foreground presentation, the sound comes from the app itself", async () => {
    const { Notifications } = load();
    const handler = Notifications.setNotificationHandler.mock.calls[0][0];
    expect(await handler?.handleNotification({} as Notification)).toEqual({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });
});

describe("syncRestEndNotification", () => {
  it("logs a failed schedule and keeps serving later ones", async () => {
    const { Notifications, sync } = load();
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error("no channel"));
    sync(Date.now() + 45_000);
    await flush();
    expect(error).toHaveBeenCalledWith(expect.any(Error));

    sync(Date.now() + 60_000);
    await flush();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it("survives a failed startup cleanup", async () => {
    const { Notifications, sync } = load({ bootFails: true });
    sync(Date.now() + 45_000);
    await flush();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it("creates the rest channel on Android before scheduling", async () => {
    const { Notifications, sync } = load({ platform: "android" });
    sync(Date.now() + 45_000);
    await flush();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "rest",
      expect.objectContaining({ name: "Rest timer" }),
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it("is a no-op inside Expo Go on Android, where the module cannot load", async () => {
    const { Notifications, sync } = load({ platform: "android", expoGo: true });
    sync(Date.now() + 45_000);
    await flush();
    expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it("cancels pending notifications and schedules one at the rest end", async () => {
    const { Notifications, sync } = load();
    const restEndsAt = Date.now() + 45_000;
    sync(restEndsAt);
    await flush();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: expect.objectContaining({ title: "Rest over" }),
      trigger: { type: "date", date: restEndsAt, channelId: "rest" },
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("only cancels when rest is cleared or already over", async () => {
    const { Notifications, getSettings, sync } = load();
    sync(null);
    sync(Date.now() - 1);
    await flush();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(getSettings).not.toHaveBeenCalled();
  });

  it("schedules nothing when timer sounds are off", async () => {
    const { Notifications, sync } = load({ timerSounds: false });
    sync(Date.now() + 45_000);
    await flush();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("asks for permission once when it can, and gives up when it cannot", async () => {
    const asks = load({ current: permission(false, true) });
    asks.Notifications.requestPermissionsAsync.mockResolvedValue(permission(true));
    asks.sync(Date.now() + 45_000);
    asks.sync(Date.now() + 60_000);
    await flush();
    expect(asks.Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(asks.Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);

    const denied = load({ current: permission(false, false) });
    denied.sync(Date.now() + 45_000);
    await flush();
    expect(denied.Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(denied.Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
