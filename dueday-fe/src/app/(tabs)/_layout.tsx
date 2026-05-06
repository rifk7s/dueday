import BottomNav from "@/components/BottomNav";
import { Tabs } from "expo-router";

function renderBottomNav(props: Parameters<typeof BottomNav>[0]) {
  return <BottomNav {...props} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={renderBottomNav}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
