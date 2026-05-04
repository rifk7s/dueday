import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_HEIGHT = 74;
const BUBBLE_SIZE = 60;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(96)).current;
  const bubbleX = useRef(new Animated.Value(0)).current;
  const [layouts, setLayouts] = useState<({ x: number; width: number } | undefined)[]>([]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  useEffect(() => {
    const activeLayout = layouts[state.index];

    if (activeLayout) {
      const targetX = activeLayout.x + activeLayout.width / 2 - BUBBLE_SIZE / 2;

      Animated.spring(bubbleX, {
        toValue: targetX,
        useNativeDriver: true,
        speed: 16,
        bounciness: 7,
      }).start();
    }
  }, [bubbleX, layouts, state.index]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: bottom, transform: [{ translateY }] }]}
    >
      <View style={styles.bar}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activeBubble, { transform: [{ translateX: bubbleX }] }]}
        >
          <Ionicons name={getActiveIcon(state.index)} size={28} color={colors.primaryContainer} />
        </Animated.View>

        <View style={styles.row}>
          <TabButton
            icon={state.index === 0 ? "home" : "home-outline"}
            focused={state.index === 0}
            onLayout={(event) => handleLayout(event, 0, setLayouts)}
            onPress={() => navigateTo(navigation, state.routes[0].name, state.routes[0].key, state.index === 0)}
          />

          <TabButton
            icon={state.index === 1 ? "calendar" : "calendar-outline"}
            focused={state.index === 1}
            onLayout={(event) => handleLayout(event, 1, setLayouts)}
            onPress={() => navigateTo(navigation, state.routes[1].name, state.routes[1].key, state.index === 1)}
          />

          <TabButton
            icon={state.index === 2 ? "person" : "person-outline"}
            focused={state.index === 2}
            onLayout={(event) => handleLayout(event, 2, setLayouts)}
            onPress={() => navigateTo(navigation, state.routes[2].name, state.routes[2].key, state.index === 2)}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function handleLayout(
  event: LayoutChangeEvent,
  index: number,
  setLayouts: React.Dispatch<React.SetStateAction<({ x: number; width: number } | undefined)[]>>
): void {
  const { x, width } = event.nativeEvent.layout;
  setLayouts((current) => {
    const next = [...current];
    next[index] = { x, width };
    return next;
  });
}

function getActiveIcon(index: number): IconName {
  if (index === 1) return "calendar";
  if (index === 2) return "person";
  return "home";
}

type TabButtonProps = {
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

function TabButton({ icon, focused, onPress, onLayout }: TabButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={14}
      onLayout={onLayout}
      onPress={onPress}
      style={styles.tabButton}
    >
      <View style={styles.iconSlot}>
        <Ionicons name={icon} size={24} color={focused ? "transparent" : "#FFFFFF"} />
      </View>
    </Pressable>
  );
}

function navigateTo(
  navigation: BottomTabBarProps["navigation"],
  routeName: string,
  routeKey: string,
  focused: boolean
): void {
  const event = navigation.emit({
    type: "tabPress",
    target: routeKey,
    canPreventDefault: true,
  });

  if (!focused && !event.defaultPrevented) {
    navigation.navigate(routeName);
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    minHeight: TAB_HEIGHT,
    backgroundColor: colors.primaryContainer,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 18,
    overflow: "visible",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    minHeight: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeBubble: {
    position: "absolute",
    top: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
});
