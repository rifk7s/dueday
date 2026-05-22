import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ScheduleCardItem = {
  kind: "task" | "activity";
  startHour: number;
  endHour: number;
  title: string;
  color: string;
  accent: string;
  column?: number;
  columnCount?: number;
};

type ScheduleCardProps = {
  item: ScheduleCardItem;
  startHour: number;
  slotHeight: number;
  stackCount?: number;
  onPress?: () => void;
};

export function ScheduleCard({ item, startHour, slotHeight, stackCount = 1, onPress }: Readonly<ScheduleCardProps>) {
  const isTask = item.kind === "task";
  const durationHeight = (item.endHour - item.startHour) * slotHeight + 28;
  const baseHeight = isTask ? 84 : durationHeight;
  const height = stackCount > 1 ? Math.max(baseHeight, durationHeight) : baseHeight;
  const top = isTask
    ? (item.startHour - startHour) * slotHeight + (slotHeight - height) / 2
    : (item.startHour - startHour) * slotHeight + 24;
  const titleLines = stackCount > 1 ? 2 : 2;

  return (
    <Pressable
      style={[
        styles.scheduleCard,
        {
          backgroundColor: item.color,
          top,
          height,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.scheduleAccent, { backgroundColor: item.accent }]} />
      {stackCount > 1 ? (
        <View style={styles.stackBadge}>
          <Text style={styles.stackBadgeText}>{stackCount} jadwal</Text>
        </View>
      ) : null}

      <Text numberOfLines={titleLines} style={styles.scheduleTitle}>
        {item.title}
      </Text>
      {isTask ? (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.timeText} numberOfLines={1}>
            {stackCount > 1 ? `${formatHour(item.startHour)} • ${stackCount} item` : formatHour(item.startHour)}
          </Text>
        </View>
      ) : (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.timeText} numberOfLines={1}>
            {stackCount > 1
              ? `${formatHour(item.startHour)} - ${formatHour(item.endHour)} • ${stackCount} item`
              : `${formatHour(item.startHour)} - ${formatHour(item.endHour)}`}
          </Text>
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
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 44,
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
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts["800"],
    color: colors.onSurface,
    flexShrink: 1,
  },
  stackBadge: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHigh,
  },
  stackBadgeText: {
    fontSize: 11,
    lineHeight: 12,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  timeRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    lineHeight: 14,
    fontFamily: fonts["600"],
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
});
