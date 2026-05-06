import "@/global.css";
import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";

function renderBottomNav(props: Parameters<typeof BottomNav>[0]) {
  return <BottomNav {...props} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={renderBottomNav}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
