import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission() {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function registerForDailyReminder() {
  // Local scheduled notifications aren't supported on web at all.
  // Calling these APIs there throws immediately, so just skip.
  if (Platform.OS === "web") {
    return;
  }

  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.cancelScheduledNotificationAsync("daily-reminder").catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: "daily-reminder",
    content: {
      title: "🌱 Bloom Garden",
      body: "Don't forget to check in today and keep your garden growing!",
    },
    trigger: {
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });
}

/**
 * Fires an immediate local notification nudging the user that their partner
 * already checked in today. This only works while this device has the app
 * installed and notification permissions granted; it is NOT a true
 * cross-device push (that would require a server / Cloud Function sending
 * via FCM/APNs), but it covers the common case of "app in background".
 */
export async function notifyPartnerCheckedIn() {
  if (Platform.OS === "web") return;

  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌤️ Your turn!",
      body: "Your partner just checked in. Check in too to keep the streak alive!",
    },
    trigger: null,
  });
}
