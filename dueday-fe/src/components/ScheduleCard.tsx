import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ScheduleCardItem = {
  kind: "task" | "activity";
  startHour: number;
  endHour: number;
  title: string;
  color: string;
  accent: string;
};

type ScheduleCardProps = {
  item: ScheduleCardItem;
  startHour: number;
  slotHeight: number;
  onPress?: () => void;
};

export function ScheduleCard({ item, startHour, slotHeight, onPress }: Readonly<ScheduleCardProps>) {
  const isTask = item.kind === "task";
  const height = isTask ? 72 : (item.endHour - item.startHour) * slotHeight + 28;
  const top = isTask
    ? (item.startHour - startHour) * slotHeight + (slotHeight - height) / 2
    : (item.startHour - startHour) * slotHeight + 24;

  return (
    <Pressable
      style={[styles.scheduleCard, { backgroundColor: item.color, top, height }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.scheduleAccent, { backgroundColor: item.accent }]} />
      <Text style={styles.scheduleTitle}>{item.title}</Text>
      {isTask ? (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.timeText}>{formatHour(item.startHour)}</Text>
        </View>
      ) : (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.timeText}>{`${formatHour(item.startHour)} - ${formatHour(item.endHour)}`}</Text>
        </View>
      )}
    </Pressable>
  );
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}.00`;
}

const styles = StyleSheet.create({
  scheduleCard: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: "hidden",
    shadowColor: colors.onSurface,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  scheduleAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  scheduleTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: fonts["800"],
    color: colors.onSurface,
  },
  timeRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: typography.bodySm.fontSize,
    lineHeight: 16,
    fontFamily: fonts["600"],
    color: colors.onSurfaceVariant,
  },
});
