import { SessionProvider, useSession } from "@/auth/ctx";
import { SplashScreenController } from "@/auth/splash";
import { modalScreenOptions, stackScreenOptions, successScreenOptions } from "@/constants/navigation";
import "@/global.css";
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
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Alert } from "react-native";
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
  );
}

// Global notification response handler: show popup for payment success notifications
function useNotificationResponseHandler() {
  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data as any;
        if (data?.type === "payment-success") {
          const planName = data.planName ?? "Paket Premium";
          const features = data.features ? JSON.parse(data.features) : null;
          const message = features
            ? `Kamu mendapatkan: \n- ${features.map((f: any) => f.title).join("\n- ")}`
            : "Langganan premium sudah aktif.";
          Alert.alert(planName, message, [{ text: "OK" }], { cancelable: true });
        }
      } catch (e) {
        // ignore malformed payloads
      }
    });

    return () => sub.remove();
  }, []);
}

function RootNavigator() {
  const { token } = useSession();

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="premium-plan" options={modalScreenOptions} />
        <Stack.Screen name="payment" options={modalScreenOptions} />
        <Stack.Screen name="detail-transfer" options={modalScreenOptions} />
        <Stack.Screen name="payment-success" options={successScreenOptions} />
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
