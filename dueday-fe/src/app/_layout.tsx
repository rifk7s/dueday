import { SessionProvider, useSession } from "@/auth/ctx";
import { SplashScreenController } from "@/auth/splash";
import { modalScreenOptions, stackScreenOptions, successScreenOptions } from "@/constants/navigation";
import "@/global.css";
import { scheduleSyncReminderNotifications } from "@/hooks/useReminders";
import { parseReminderId, recordDelivered, syncPresented } from "@/lib/notificationHistory";
import { ensureAndroidChannel, setupNotificationHandler } from "@/lib/notifications";
import {
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
    useFonts,
} from "@expo-google-fonts/lexend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Alert, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();
ensureAndroidChannel().catch(() => null);

// Keep (tabs) anchored behind deep-linked modals so back / dismissAll always
// has a base (Expo Router modal guidance).
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
  });

  // Ensure the notification response handler hook is called on every render
  // (must run before any early returns so hook order stays stable).
  useNotificationResponseHandler();

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <SplashScreenController />
              <RootNavigator />
            </SessionProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Deep-link a tapped OS notification to the matching screen, mirroring the
// in-app Notifikasi screen's navigation. Reminder identifiers carry the entity
// (e.g. `reminder:task:42:h-hari`); anything unrecognized just opens the app.
function routeFromNotification(notification: Notifications.Notification): void {
  const { kind, sourceId } = parseReminderId(notification.request.identifier);
  if (kind === "task" && sourceId) {
    router.push({ pathname: "/taskprogress", params: { id: sourceId, tab: "tugas" } });
  } else if (kind === "activity" && sourceId) {
    router.push({ pathname: "/activityprogress", params: { id: sourceId } });
  } else if (kind === "premium") {
    router.push("/premium-plan");
  } else if (kind === "summary") {
    router.push("/list");
  }
}

function showPaymentSuccessAlert(data: any): void {
  try {
    const planName = data.planName ?? "Paket Premium";
    const features = data.features ? JSON.parse(data.features) : null;
    const message = features
      ? `Kamu mendapatkan: \n- ${features.map((f: any) => f.title).join("\n- ")}`
      : "Langganan premium sudah aktif.";
    Alert.alert(planName, message, [{ text: "OK" }], { cancelable: true });
  } catch {
    // ignore malformed payloads
  }
}

// Global notification handling: record deliveries into the in-app history,
// deep-link a tapped notification to the right screen, and show a popup for
// payment-success notifications.
function useNotificationResponseHandler() {
  // Covers both a tap while the app runs AND a cold start (app launched by
  // tapping a notification) — the hook returns that launching response too.
  const lastResponse = Notifications.useLastNotificationResponse();

  React.useEffect(() => {
    // Foreground deliveries (not taps).
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      void recordDelivered(notification);
    });

    // Pull anything sitting in the OS tray on launch, and again whenever the
    // app returns to the foreground (captures deliveries from background/killed).
    void syncPresented();
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPresented();
    });

    return () => {
      receivedSub.remove();
      appStateSub.remove();
    };
  }, []);

  React.useEffect(() => {
    // Only the default tap (not custom action buttons), once per response.
    if (!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const notification = lastResponse.notification;
    void recordDelivered(notification);

    const data = notification.request.content.data as any;
    if (data?.type === "payment-success") {
      showPaymentSuccessAlert(data);
      return;
    }
    // Defer one tick so the router is mounted on a cold start before we push.
    setTimeout(() => routeFromNotification(notification), 0);
  }, [lastResponse]);
}

function RootNavigator() {
  const { token } = useSession();

  // Reminder scheduling is otherwise only triggered by in-app task/activity CRUD
  // and reminder-settings changes. Server-created tasks (e-learn backfill, etc.)
  // never trigger it, so their reminders go unscheduled. Sync once per logged-in
  // session so every active task — manual or server-created — gets its reminders.
  // (The sync is internally debounced, so a duplicate call is harmless.)
  React.useEffect(() => {
    if (token) scheduleSyncReminderNotifications(token);
  }, [token]);

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="premium-plan" options={modalScreenOptions} />
        <Stack.Screen name="payment" options={modalScreenOptions} />
        <Stack.Screen name="detail-transfer" options={modalScreenOptions} />
        <Stack.Screen name="payment-success" options={successScreenOptions} />
        <Stack.Screen name="payment-rejected" options={successScreenOptions} />
        <Stack.Screen name="create-task" options={modalScreenOptions} />
        <Stack.Screen name="create-activity" options={modalScreenOptions} />
        <Stack.Screen name="edit-activity" options={modalScreenOptions} />
        <Stack.Screen name="set-reminder" options={modalScreenOptions} />
        <Stack.Screen name="activityprogress" />
        <Stack.Screen name="list" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reminder-list" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
