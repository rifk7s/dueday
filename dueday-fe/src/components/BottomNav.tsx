import { colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { TAB_BAR_HEIGHT, useBottomBarInset } from "@/hooks/useBottomBarSpace";

const TAB_HEIGHT = TAB_BAR_HEIGHT;
const ACTIVE_BUBBLE_SIZE = 92;
const ACTIVE_DISC_SIZE = 70;
// How far the active bubble pops above the bar top. Fixed (not derived from
// bar height) so shrinking TAB_HEIGHT doesn't blow up the pop distance.
const ACTIVE_BUBBLE_TOP = -44;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function BottomNav({ state, navigation }: Readonly<BottomTabBarProps>) {
  const bottomInset = useBottomBarInset();
  const translateY = useRef(new Animated.Value(TAB_HEIGHT + bottomInset + 24)).current;
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
      const targetX = activeLayout.x + activeLayout.width / 2 - ACTIVE_BUBBLE_SIZE / 2;

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
      style={[styles.wrapper, { transform: [{ translateY }] }]}
    >
      <View style={[styles.bar, { height: TAB_HEIGHT + bottomInset, paddingBottom: bottomInset }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activeBubble, { transform: [{ translateX: bubbleX }] }]}
        >
          <View style={styles.activeDisc}>
            <MaterialCommunityIcons name={getActiveIcon(state.index)} size={28} color={colors.onPrimary} />
          </View>
        </Animated.View>

        <View style={styles.row}>
          <TabButton
                icon="home-outline"
            focused={state.index === 0}
            onLayout={(event) => handleLayout(event, 0, setLayouts)}
            onPress={() => navigateTo(navigation, state.routes[0].name, state.routes[0].key, state.index === 0)}
          />

          <TabButton
                icon="calendar-month-outline"
            focused={state.index === 1}
            onLayout={(event) => handleLayout(event, 1, setLayouts)}
            onPress={() => navigateTo(navigation, state.routes[1].name, state.routes[1].key, state.index === 1)}
          />

          <TabButton
                icon="account-outline"
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
  if (index === 1) return "calendar-month";
  if (index === 2) return "account";
  return "home";
}

type TabButtonProps = {
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

function TabButton({ icon, focused, onPress, onLayout }: Readonly<TabButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={14}
      onLayout={onLayout}
      onPress={onPress}
      style={styles.tabButton}
    >
      <View style={[styles.iconSlot, focused && styles.hiddenIcon]}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.onPrimary} />
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: colors.onSurface,
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
  hiddenIcon: {
    opacity: 0,
  },
  activeBubble: {
    position: "absolute",
    top: ACTIVE_BUBBLE_TOP,
    width: ACTIVE_BUBBLE_SIZE,
    height: ACTIVE_BUBBLE_SIZE,
    borderRadius: ACTIVE_BUBBLE_SIZE / 2,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 14,
  },
  activeDisc: {
    width: ACTIVE_DISC_SIZE,
    height: ACTIVE_DISC_SIZE,
    borderRadius: ACTIVE_DISC_SIZE / 2,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});
