import DatePickerCalendar from "@/components/DatePickerCalendar";
import { ScheduleCard } from "@/components/ScheduleCard";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomBarSpace } from "@/hooks/useBottomBarSpace";

type ScheduleItem = {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  title: string;
  color: string;
  accent: string;
};
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useTasksQuery } from "@/hooks/useTasks";

// Colors / accents palette used when activity/tag doesn't provide explicit color
const ACCENT_PALETTE = [
  "#e0a400",
  "#23b56a",
  "#8f54dd",
  "#fb7185",
  "#6366f1",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#0ea5e9",
];

const START_HOUR = 7;
const END_HOUR = 16;
const SLOT_HEIGHT = 72;
const timelineHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

export default function CalendarScreen() {
  const { top } = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}/${today.getFullYear()}`;
  });
  const selectedDay = selectedDate.split("/")[0];
  const { data: activities = [] } = useActivitiesQuery();
  const { data: tasks = [] } = useTasksQuery();

  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const fromActivities: ScheduleItem[] = activities
      .filter((a) => !!a.tanggal)
      .map((a, idx) => {
        const datePart = a.tanggal ? (a.tanggal.substring(8, 10)) : ""; // DD from YYYY-MM-DD
        const start = a.time_start ? parseInt(a.time_start.substring(0, 2), 10) : START_HOUR;
        const endRaw = a.time_end ? parseInt(a.time_end.substring(0, 2), 10) : start + 1;
        const end = Math.min(Math.max(endRaw, start + 1), END_HOUR);
        const accent = ACCENT_PALETTE[(a.id_tag ?? idx) % ACCENT_PALETTE.length];
        return {
          id: a.id,
          date: datePart,
          startHour: start,
          endHour: end,
          title: a.activity_name,
          color: colors.surfaceContainerLowest,
          accent,
        } as ScheduleItem;
      });

    const fromTasks: ScheduleItem[] = tasks
      .filter((t) => !!t.date)
      .map((t, idx) => {
        // task.date may include time (ISO) or be plain YYYY-MM-DD
        const dateRaw = t.date || "";
        const datePart = dateRaw.length >= 10 ? dateRaw.substring(8, 10) : "";
        const start = t.time ? parseInt(t.time.substring(0, 2), 10) : START_HOUR;
        const end = Math.min(start + 1, END_HOUR);
        const accent = ACCENT_PALETTE[(t.id_tag ?? idx) % ACCENT_PALETTE.length];
        return {
          id: t.id,
          date: datePart,
          startHour: start,
          endHour: end,
          title: t.task_name,
          color: colors.surfaceContainerLowest,
          accent,
        } as ScheduleItem;
      });

    return [...fromActivities, ...fromTasks];
  }, [activities]);

  const markedDays = Array.from(new Set(scheduleItems.map((item) => item.date)));
  const selectedScheduleItems = scheduleItems.filter((item) => item.date === selectedDay);
  const hasSelectedScheduleItems = selectedScheduleItems.length > 0;
  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarSpace + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Jadwal</Text>
          <Ionicons name="search-outline" size={22} color={colors.primaryContainer} />
        </View>

        <View style={styles.calendarSection}>
          <DatePickerCalendar
            visible
            inline
            selectedDate={selectedDate}
            onClose={() => undefined}
            onDateSelect={setSelectedDate}
            markedDays={markedDays}
          />
        </View>

        <View style={styles.schedulePanel}>
          <View style={styles.schedulePanelHeader}>
            <View>
              <Text style={styles.schedulePanelTitle}>Jadwal Hari Ini</Text>
              <Text style={styles.schedulePanelSubtitle}>
                {hasSelectedScheduleItems ? `${selectedScheduleItems.length} kegiatan ditemukan` : "Tidak ada kegiatan pada tanggal ini"}
              </Text>
            </View>
          </View>

          {hasSelectedScheduleItems ? (
            <View style={styles.scheduleContainer}>
              <View style={styles.hoursColumn}>
                <View style={styles.hoursRail} />
                {timelineHours.map((hour) => (
                  <View key={hour} style={styles.hourRow}>
                    <View style={styles.hourPill}>
                      <Text style={styles.hourText}>{formatHour(hour)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.cardsColumn}>
                <View style={styles.cardsLayer}>
                  {selectedScheduleItems.map((item) => (
                    <Link
                      key={item.id}
                      href={{
                        pathname: "/activityprogress",
                        params: {
                          title: item.title,
                          date: item.date,
                          startHour: item.startHour.toString(),
                          endHour: item.endHour.toString(),
                          color: item.color,
                          accent: item.accent,
                        },
                      }}
                      asChild
                    >
                      <ScheduleCard item={item} startHour={START_HOUR} slotHeight={SLOT_HEIGHT} />
                    </Link>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyOnlyState}>
              <Text style={styles.emptyStateText}>Tidak ada kegiatan</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}.00`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingBottom: 120,
  },
  headerRow: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 22,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  monthRow: {
    height: 58,
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  calendarSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  schedulePanel: {
    marginHorizontal: 12,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  schedulePanelHeader: {
    marginBottom: 14,
  },
  schedulePanelTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.primaryContainer,
  },
  schedulePanelSubtitle: {
    marginTop: 4,
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  scheduleContainer: {
    position: "relative",
    flexDirection: "row",
    paddingTop: 2,
  },
  hoursColumn: {
    width: 74,
    paddingRight: 10,
    position: "relative",
  },
  hoursRail: {
    position: "absolute",
    left: 33,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.7,
  },
  hourRow: {
    height: SLOT_HEIGHT,
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1,
  },
  hourPill: {
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  hourText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  cardsColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  cardsLayer: {
    position: "relative",
    height: timelineHours.length * SLOT_HEIGHT,
  },
  emptyOnlyState: {
    marginTop: 4,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["600"],
    color: colors.onSurfaceVariant,
  },
});
