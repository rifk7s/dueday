import { SessionProvider, useSession } from "@/auth/ctx";
import { SplashScreenController } from "@/auth/splash";
import "@/global.css";
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
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
  });

  if (!loaded && !error) {
    return null;
  }

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

function RootNavigator() {
  const { token } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="premium-plan" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="detail-transfer" />
        <Stack.Screen name="create-task" />
        <Stack.Screen name="create-activity" />
        <Stack.Screen name="activityprogress" />
        <Stack.Screen name="list" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
