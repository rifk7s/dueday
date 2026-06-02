import { fromApiDate, toApiDate } from "@/api/format";
import DatePickerCalendar from "@/components/DatePickerCalendar";
import { ScheduleCard } from "@/components/ScheduleCard";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useBottomBarSpace } from "@/hooks/useBottomBarSpace";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScheduleItem = {
  id: string;
  kind: "task" | "activity";
  dateKey: string;
  startHour: number;
  endHour: number;
  title: string;
  color: string;
  accent: string;
  recurring?: boolean;
  column?: number;
  columnCount?: number;
};

type ScheduleCluster = {
  id: string;
  startHour: number;
  endHour: number;
  items: ScheduleItem[];
  summaryItem: ScheduleItem;
};

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

const CARD_BG_PALETTE = [
  "#fff1c7",
  "#d6fbf2",
  "#eadcff",
  "#ffe2ea",
  "#dbe7ff",
  "#dff0ff",
  "#dcfce7",
  "#fff0cf",
  "#dff7ff",
];

const START_HOUR = 0;
const END_HOUR = 23;
const SLOT_HEIGHT = 72;
const timelineHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
// Forward-only projection window for a recurring activity's future occurrences.
// The backend uses a rolling single-occurrence model, so we only ever project
// the live row forward from max(anchor, today) — never into the past.
const RECURRING_HORIZON_YEARS = 1;

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}/${today.getFullYear()}`;
  });
  const [activeCluster, setActiveCluster] = useState<ScheduleCluster | null>(null);
  const selectedDateKey = toApiDate(selectedDate);
  const { data: activities = [] } = useActivitiesQuery();
  const { data: tasks = [] } = useTasksQuery();

  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const fromActivities = activities
      .filter((a) => !!a.tanggal && a.status !== "cancelled")
      .flatMap((a, idx) => {
        const dateKey = normalizeDateKey(a.tanggal);
        const start = a.time_start ? parseInt(a.time_start.substring(0, 2), 10) : START_HOUR;
        const endRaw = a.time_end ? parseInt(a.time_end.substring(0, 2), 10) : start + 1;
        const end = Math.min(Math.max(endRaw, start + 1), END_HOUR);
        const accent = ACCENT_PALETTE[(a.id_tag ?? idx) % ACCENT_PALETTE.length];
        const baseItem: ScheduleItem = {
          id: a.id,
          kind: "activity",
          dateKey,
          startHour: start,
          endHour: end,
          title: a.activity_name,
          color: CARD_BG_PALETTE[(a.id_tag ?? idx) % CARD_BG_PALETTE.length],
          accent,
          recurring: false,
        };

        if (!a.ulangi) {
          return [baseItem];
        }

        const recurrenceItems = buildRecurringScheduleItems(a, idx);
        return recurrenceItems.length > 0 ? recurrenceItems : [baseItem];
      });

    const fromTasks: ScheduleItem[] = tasks
      .filter((t) => !!t.date)
      .map((t, idx) => {
        const dateKey = normalizeDateKey(t.date);
        const start = t.time ? parseInt(t.time.substring(0, 2), 10) : START_HOUR;
        const end = Math.min(start + 1, END_HOUR);
        const accent = ACCENT_PALETTE[(t.id_tag ?? idx) % ACCENT_PALETTE.length];
        return {
          id: t.id,
          kind: "task",
          dateKey,
          startHour: start,
          endHour: end,
          title: t.task_name,
          color: CARD_BG_PALETTE[(t.id_tag ?? idx) % CARD_BG_PALETTE.length],
          accent,
        } as ScheduleItem;
      });

    return [...fromActivities, ...fromTasks];
  }, [activities, tasks]);

  const markedDays = useMemo(() => scheduleItems.map((item) => item.dateKey), [scheduleItems]);
  const selectedScheduleItems = useMemo(
    () => scheduleItems.filter((item) => item.dateKey === selectedDateKey),
    [scheduleItems, selectedDateKey],
  );
  const scheduleClusters = useMemo(() => groupOverlappingScheduleItems(selectedScheduleItems), [selectedScheduleItems]);
  const hasSelectedScheduleItems = scheduleClusters.length > 0;
  const selectedDateLabel = selectedDateKey ? fromApiDate(selectedDateKey) : selectedDate;

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarSpace + 24 }]}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>{t("calendar.title")}</Text>
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
              <Text style={styles.schedulePanelTitle}>{t("calendar.selectedDateSchedule")}</Text>
              <Text style={styles.schedulePanelSubtitle}>
                {hasSelectedScheduleItems
                  ? t("calendar.scheduleSummary", {
                      count: selectedScheduleItems.length,
                      slots: scheduleClusters.length,
                      date: selectedDateLabel,
                    })
                  : t("calendar.noScheduleOnDate", { date: selectedDateLabel })}
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
                  {scheduleClusters.map((cluster) => (
                    <ScheduleCard
                      key={cluster.id}
                      item={cluster.summaryItem}
                      startHour={START_HOUR}
                      slotHeight={SLOT_HEIGHT}
                      stackCount={cluster.items.length}
                      onPress={() => {
                        if (cluster.items.length === 1) {
                          const item = cluster.items[0];
                          if (!item) return;

                          router.push(
                            item.kind === "task"
                              ? { pathname: "/taskprogress", params: { id: item.id, tab: "tugas" } }
                              : { pathname: "/activityprogress", params: { id: item.id, tab: "aktivitas" } },
                          );
                          return;
                        }

                        setActiveCluster(cluster);
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyOnlyState}>
              <Text style={styles.emptyStateText}>{t("calendar.noSchedule")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={activeCluster !== null} transparent animationType="fade" onRequestClose={() => setActiveCluster(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveCluster(null)} />

          {activeCluster ? (
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{t("calendar.scheduleList")}</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatHour(activeCluster.startHour)} - {formatHour(activeCluster.endHour)}
                  </Text>
                </View>

                <Pressable style={styles.modalCloseButton} accessibilityRole="button" onPress={() => setActiveCluster(null)}>
                  <Ionicons name="close" size={20} color={colors.onSurface} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                {activeCluster.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.modalListItem}
                    onPress={() => {
                      setActiveCluster(null);
                      router.push(
                        item.kind === "task"
                          ? { pathname: "/taskprogress", params: { id: item.id, tab: "tugas" } }
                          : { pathname: "/activityprogress", params: { id: item.id, tab: "aktivitas" } }
                      );
                    }}
                  >
                    <View style={[styles.modalItemAccent, { backgroundColor: item.accent }]} />
                    <View style={styles.modalItemBody}>
                      <Text style={styles.modalItemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.modalItemMeta}>
                        {item.kind === "task"
                          ? `${t("common.task")} • ${formatHour(item.startHour)}`
                          : `${t("common.activity")} • ${formatHour(item.startHour)} - ${formatHour(item.endHour)}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.iconSubtle} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}.00`;
}

function buildRecurringScheduleItems(activity: { id: string; activity_name: string; tanggal: string | null; anchor_date?: string | null; time_start: string | null; time_end: string | null; id_tag: number | null; ulangi: string | null }, idx: number): ScheduleItem[] {
  const baseDateString = activity.anchor_date ?? activity.tanggal;
  const baseDate = parseDateKey(baseDateString);
  if (!baseDate || !activity.ulangi) {
    return [];
  }

  // Forward-only projection: start at max(anchor, today) so past occurrences are
  // never re-painted (those live as their own static rows after each reset), and
  // cap the window one horizon ahead to bound the work.
  const today = startOfToday();
  const rangeStart = baseDate.getTime() > today.getTime() ? baseDate : today;
  const rangeEnd = addYears(rangeStart, RECURRING_HORIZON_YEARS);

  const startHour = activity.time_start ? parseInt(activity.time_start.substring(0, 2), 10) : START_HOUR;
  const endRaw = activity.time_end ? parseInt(activity.time_end.substring(0, 2), 10) : startHour + 1;
  const endHour = Math.min(Math.max(endRaw, startHour + 1), END_HOUR);
  const accent = ACCENT_PALETTE[(activity.id_tag ?? idx) % ACCENT_PALETTE.length];
  const color = CARD_BG_PALETTE[(activity.id_tag ?? idx) % CARD_BG_PALETTE.length];

  const dates = expandRecurringDates(baseDate, rangeStart, rangeEnd, activity.ulangi);

  return dates.map((date) => ({
    id: activity.id,
    kind: "activity",
    dateKey: toDateKey(date),
    startHour,
    endHour,
    title: activity.activity_name,
    color,
    accent,
    recurring: true,
  }));
}

function expandRecurringDates(baseDate: Date, rangeStart: Date, rangeEnd: Date, recurrence: string): Date[] {
  const dates: Date[] = [];

  switch (recurrence) {
    case "setiap_hari": {
      let current = new Date(baseDate);
      alignTime(current, baseDate);

      while (current <= rangeEnd) {
        if (current >= rangeStart) {
          dates.push(new Date(current));
        }
        current = addDays(current, 1);
      }
      break;
    }
    case "satu_minggu": {
      let current = new Date(baseDate);
      alignTime(current, baseDate);

      while (current <= rangeEnd) {
        if (current >= rangeStart) {
          dates.push(new Date(current));
        }
        current = addDays(current, 7);
      }
      break;
    }
    case "satu_bulan": {
      const baseDay = baseDate.getDate();
      for (let monthOffset = 0; ; monthOffset += 1) {
        const current = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, baseDay);
        alignTime(current, baseDate);

        if (current > rangeEnd) {
          break;
        }

        // getDate() !== baseDay means the day overflowed into the next month
        // (e.g. the 31st in a 30-day month) — skip rather than shift.
        if (current >= rangeStart && current.getDate() === baseDay) {
          dates.push(current);
        }
      }
      break;
    }
    case "satu_tahun": {
      const baseMonth = baseDate.getMonth();
      const baseDay = baseDate.getDate();
      for (let yearOffset = 0; ; yearOffset += 1) {
        const current = new Date(baseDate.getFullYear() + yearOffset, baseMonth, baseDay);
        alignTime(current, baseDate);

        if (current > rangeEnd) {
          break;
        }

        // Skip Feb 29 on non-leap years instead of rolling into March.
        if (current >= rangeStart && current.getMonth() === baseMonth && current.getDate() === baseDay) {
          dates.push(current);
        }
      }
      break;
    }
  }

  return dates;
}

function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;

  const dateOnly = value.split("T")[0] ?? value;
  const isoMatch = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const slashMatch = dateOnly.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function alignTime(target: Date, source: Date): void {
  target.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), 0);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string | null | undefined): string {
  if (!value) return "";

  const normalized = value.trim();
  const dateOnly = normalized.split("T")[0] ?? normalized;
  const isoMatch = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function groupOverlappingScheduleItems(items: ScheduleItem[]): ScheduleCluster[] {
  if (items.length === 0) {
    return [];
  }

  const sortedItems = [...items].sort((a, b) => {
    if (a.startHour !== b.startHour) return a.startHour - b.startHour;
    if (a.endHour !== b.endHour) return a.endHour - b.endHour;
    return a.id.localeCompare(b.id);
  });

  const clusters: ScheduleItem[][] = [];
  let currentCluster: ScheduleItem[] = [];
  let currentClusterEnd = -1;

  for (const item of sortedItems) {
    if (currentCluster.length === 0 || item.startHour < currentClusterEnd) {
      currentCluster.push(item);
      currentClusterEnd = currentCluster.length === 1 ? item.endHour : Math.max(currentClusterEnd, item.endHour);
      continue;
    }

    clusters.push(currentCluster);
    currentCluster = [item];
    currentClusterEnd = item.endHour;
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters.map((cluster, index) => {
    const startHour = Math.min(...cluster.map((item) => item.startHour));
    const endHour = Math.max(...cluster.map((item) => item.endHour));

    return {
      id: `${cluster[0]?.dateKey ?? "slot"}-${startHour}-${endHour}-${index}`,
      startHour,
      endHour,
      items: cluster,
      summaryItem: {
        ...cluster[0],
        startHour,
        endHour,
        column: 0,
        columnCount: 1,
      },
    };
  });
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
    paddingBottom: 8,
    backgroundColor: colors.surfaceContainerLowest,
    zIndex: 2,
    elevation: 2,
  },
  schedulePanel: {
    marginHorizontal: 12,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 40, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 16,
    maxHeight: "78%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    fontFamily: typography.h3.fontFamily,
    color: colors.onSurface,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
  },
  modalList: {
    gap: 10,
    paddingBottom: 4,
  },
  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
  },
  modalItemAccent: {
    width: 6,
    alignSelf: "stretch",
    borderRadius: 999,
  },
  modalItemBody: {
    flex: 1,
    gap: 4,
  },
  modalItemTitle: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  modalItemMeta: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
});
