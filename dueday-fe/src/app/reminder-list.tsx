import { type Activity } from "@/api/activities";
import { fromApiDate, fromApiTime } from "@/api/format";
import { type Task } from "@/api/tasks";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useCurrentUserQuery } from "@/hooks/useCurrentUser";
import { useReminderSettingsQuery } from "@/hooks/useReminders";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReminderCardItem = {
  id: string;
  label: string;
  count: number;
  nearestDate: string;
  nearestTime: string;
  type: "task" | "activity";
  sourceId: string | null;
  reminderMessage: string | null;
  reminderStyle?: string | null;
  reminderSound?: string | null;
  reminderFrequency?: "once" | "daily" | "weekly" | null;
  reminderVibrate?: boolean | null;
};

export default function ReminderListScreen() {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: tasks = [] } = useTasksQuery();
  const { data: activities = [] } = useActivitiesQuery();
  const currentUserQuery = useCurrentUserQuery({ enabled: true });
  const isPremium = currentUserQuery.data?.status === "subscribed";
  const settingsQuery = useReminderSettingsQuery();
  const [detailOpen, setDetailOpen] = React.useState<"task" | "activity" | null>(null);

  const allReminders = React.useMemo<ReminderCardItem[]>(() => {
    const activeTasks = [...tasks]
      .filter((task) => task.status !== "completed" && task.status !== "completed_late")
      .sort(compareTasks);
    const activeActivities = [...activities]
      .filter((activity) => activity.status !== "completed" && activity.status !== "cancelled")
      .sort(compareActivities);

    return [
      {
        id: "tasks-summary",
        label: t("common.task"),
        count: activeTasks.length,
        nearestDate:
          activeTasks[0] != null
            ? fromApiDate(activeTasks[0].date) || t("reminderList.dateNotSet")
            : t("reminderList.noTaskScheduled"),
        nearestTime:
          activeTasks[0] != null
            ? fromApiTime(activeTasks[0].time) || t("reminderList.timeNotSet")
            : t("reminderList.noTime"),
        type: "task",
        sourceId: activeTasks[0]?.id ?? null,
        reminderMessage: activeTasks[0]?.reminder_message ?? null,
        reminderStyle: activeTasks[0]?.reminder_style ?? null,
        reminderSound: activeTasks[0]?.reminder_sound ?? null,
        reminderFrequency: activeTasks[0]?.reminder_frequency ?? null,
        reminderVibrate: activeTasks[0]?.reminder_vibrate ?? null,
      },
      {
        id: "activities-summary",
        label: t("common.activity"),
        count: activeActivities.length,
        nearestDate:
          activeActivities[0] != null
            ? fromApiDate(activeActivities[0].tanggal) || t("reminderList.dateNotSet")
            : t("reminderList.noActivityScheduled"),
        nearestTime:
          activeActivities[0] != null
            ? fromApiTime(activeActivities[0].time_start) || t("reminderList.timeNotSet")
            : t("reminderList.noTime"),
        type: "activity",
        sourceId: activeActivities[0]?.id ?? null,
        reminderMessage: activeActivities[0]?.reminder_message ?? null,
        reminderStyle: activeActivities[0]?.reminder_style ?? null,
        reminderSound: activeActivities[0]?.reminder_sound ?? null,
        reminderFrequency: activeActivities[0]?.reminder_frequency ?? null,
        reminderVibrate: activeActivities[0]?.reminder_vibrate ?? null,
      },
    ];
  }, [tasks, activities, t]);

  const stats = React.useMemo(() => {
    // Target counts for today only
    const today = new Date().toISOString().split("T")[0];

    const tasksToday = tasks.filter(
      (t) =>
        t.date === today &&
        t.status !== "completed" &&
        t.status !== "completed_late"
    ).length;

    const activitiesToday = activities.filter(
      (a) => a.tanggal === today && a.status !== "completed" && a.status !== "cancelled"
    ).length;

    const totalToday = tasksToday + activitiesToday;

    return { tasksToday, activitiesToday, totalToday };
  }, [tasks, activities]);

  return (
    <View style={[styles.safeArea, { paddingTop: top, paddingBottom: bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
          </Pressable>

          <Text style={styles.title}>{t("reminderList.title")}</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="notifications-outline" size={22} color={colors.primaryContainer} />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>{t("reminderList.heroTitle")}</Text>
            <Text style={styles.heroSubtitle}>
              {t("reminderList.heroSubtitle")}
            </Text>
          </View>
        </View>

        <Text style={styles.tabSummary}>{t("reminderList.reminderCount", { count: allReminders.length })}</Text>

        <StatsRow stats={stats} />

        <ReminderSection
          items={allReminders}
          emptyText={t("reminderList.empty")}
          isPremium={isPremium}
          onCardPress={(type) => setDetailOpen(type)}
        />
      </ScrollView>

      <ReminderDetailModal
        type={detailOpen}
        onClose={() => setDetailOpen(null)}
        onEdit={() => {
          if (!detailOpen) return;
          const pathname = isPremium ? "/set-reminder-premium" : "/set-reminder";
          setDetailOpen(null);
          router.push({ pathname, params: { type: detailOpen } });
        }}
        settings={detailOpen ? settingsQuery.data?.[detailOpen] ?? null : null}
        isPremium={!!isPremium}
      />
    </View>
  );
}

type ReminderSectionProps = {
  items: ReminderCardItem[];
  emptyText: string;
  isPremium?: boolean | null;
  onCardPress: (type: "task" | "activity") => void;
};

type StatsRowProps = {
  stats: {
    tasksToday: number;
    activitiesToday: number;
    totalToday: number;
  };
};

function StatsRow({ stats }: Readonly<StatsRowProps>) {
  const { t } = useTranslation();
  return (
    <View style={styles.statsRow}>
      <StatCard
        icon="document-text-outline"
        label={t("reminderList.statTasksToday")}
        value={stats.tasksToday}
        color={colors.primaryContainer}
      />
      <StatCard
        icon="sparkles-outline"
        label={t("reminderList.statActivitiesToday")}
        value={stats.activitiesToday}
        color={colors.secondaryContainer}
      />
      <StatCard
        icon="notifications-outline"
        label={t("reminderList.statTotalToday")}
        value={stats.totalToday}
        color={colors.tertiaryContainer}
      />
    </View>
  );
}

type StatCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: number;
  color: string;
};

function StatCard({ icon, label, value, color }: Readonly<StatCardProps>) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color }]}>
        <Ionicons name={icon} size={16} color={colors.surface} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReminderSection({ items, emptyText, isPremium, onCardPress }: Readonly<ReminderSectionProps>) {
  return (
    <View style={styles.section}>
      {items.length > 0 ? (
        items.map((item) => (
          <ReminderSummaryCard
            key={item.id}
            item={item}
            isPremium={!!isPremium}
            onPress={() => onCardPress(item.type)}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

type ReminderCardProps = {
  item: ReminderCardItem;
  isPremium?: boolean;
  onPress: () => void;
};

function ReminderSummaryCard({ item, isPremium, onPress }: Readonly<ReminderCardProps>) {
  const { t } = useTranslation();
  const accentColor = item.type === "task" ? colors.primaryContainer : colors.secondaryContainer;
  const icon = item.type === "task" ? "document-text-outline" : "sparkles-outline";
  const router = useRouter();

  const handleEditPress = () => {
    if (!item.sourceId) {
      return;
    }

    const pathname = isPremium ? "/set-reminder-premium" : "/set-reminder";

    router.push({
      pathname,
      params: {
        id: item.sourceId,
        type: item.type,
        label: item.label,
        time: item.nearestTime,
        message: item.reminderMessage ?? undefined,
      },
    });
  };

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={t("reminderList.detailA11y", { label: item.label })}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name={icon} size={15} color={accentColor} />
            </View>
            <View style={styles.cardTitleTextBlock}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{t("reminderList.itemsWaiting", { count: item.count })}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.edit")}
            onPress={handleEditPress}
          >
            <Ionicons name="pencil" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.detailText}>{item.nearestTime}</Text>
          </View>

          {item.reminderMessage ? (
            <View style={styles.detailItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primaryContainer} />
              <Text style={styles.messageText} numberOfLines={2}>
                {item.reminderMessage}
              </Text>
            </View>
          ) : null}
          {isPremium && (item.reminderStyle || item.reminderFrequency) ? (
            <View style={styles.metaRow}>
              {item.reminderStyle ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{item.reminderStyle}</Text>
                </View>
              ) : null}
              {item.reminderFrequency ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{item.reminderFrequency === "once" ? t("common.frequencyOnce") : item.reminderFrequency === "daily" ? t("common.repeatDaily") : t("common.repeatWeekly")}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

type ReminderSettingsSectionLite = {
  time: string | null;
  message: string | null;
  style: string | null;
  sound: string | null;
  vibrate: boolean;
} | null;

type ReminderDetailModalProps = {
  type: "task" | "activity" | null;
  onClose: () => void;
  onEdit: () => void;
  settings: ReminderSettingsSectionLite;
  isPremium: boolean;
};

function formatFireLine(d: Date, t: TFunction, now: Date = new Date()): string {
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  if (sameDay) return t("reminderList.todayAt", { time: `${hh}:${mm}` });
  return `${d.getDate()} ${months[d.getMonth()]} ${hh}:${mm}`;
}

type ScheduledItem = {
  id: string;
  title: string;
  body: string;
  fireAt: Date;
};

/**
 * expo-notifications normalizes DATE triggers per platform:
 * - iOS  → CalendarNotificationTrigger { type:'calendar', dateComponents:{...} }
 * - Android → DateNotificationTrigger  { type:'date', value:number }
 * Field `date` on the trigger is INPUT-only and not echoed back here. Handle both
 * shapes plus the rare legacy `date` field defensively.
 */
function extractTriggerDate(trigger: unknown): Date | null {
  if (!trigger || typeof trigger !== "object") return null;
  const t = trigger as Record<string, unknown>;

  if (typeof t.value === "number") {
    const ms = t.value > 1e11 ? t.value : t.value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const components = t.dateComponents as Record<string, number | undefined> | undefined;
  if (components && typeof components === "object") {
    const year = components.year ?? new Date().getFullYear();
    const month = (components.month ?? 1) - 1;
    const day = components.day ?? 1;
    const hour = components.hour ?? 0;
    const minute = components.minute ?? 0;
    const second = components.second ?? 0;
    const d = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (t.date != null) {
    const raw = t.date as number | string | Date;
    const d = raw instanceof Date ? raw : new Date(raw as string | number);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function ReminderDetailModal({ type, onClose, onEdit, settings, isPremium }: Readonly<ReminderDetailModalProps>) {
  const { t } = useTranslation();
  const [scheduled, setScheduled] = React.useState<ScheduledItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const visible = type !== null;
  const label = type === "activity" ? t("common.activity") : t("common.task");
  const prefix = type === "activity" ? "reminder:activity:" : "reminder:task:";

  React.useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    Notifications.getAllScheduledNotificationsAsync()
      .then((list) => {
        if (!active) return;
        const now = Date.now();
        const items: ScheduledItem[] = [];
        for (const n of list) {
          if (!n.identifier.startsWith(prefix)) continue;
          const date = extractTriggerDate(n.trigger);
          if (!date || date.getTime() <= now) continue;
          items.push({
            id: n.identifier,
            title: typeof n.content.title === "string" ? n.content.title : label,
            body: typeof n.content.body === "string" ? n.content.body : "",
            fireAt: date,
          });
        }
        items.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
        setScheduled(items);
      })
      .catch(() => setScheduled([]))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, prefix, label]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("reminderList.detailTitle", { label })}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>{t("reminderList.currentSettings")}</Text>
            <View style={styles.modalRow}>
              <Ionicons name="time-outline" size={16} color={colors.primaryContainer} />
              <Text style={styles.modalRowText}>{t("reminderList.timeRow", { value: settings?.time ?? t("reminderList.notSet") })}</Text>
            </View>
            {settings?.message ? (
              <View style={styles.modalRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primaryContainer} />
                <Text style={styles.modalRowText}>{t("reminderList.manualMessage", { message: settings.message })}</Text>
              </View>
            ) : null}
            {isPremium ? (
              <>
                <View style={styles.modalRow}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primaryContainer} />
                  <Text style={styles.modalRowText}>{t("reminderList.styleRow", { value: settings?.style ?? "default" })}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="musical-note-outline" size={16} color={colors.primaryContainer} />
                  <Text style={styles.modalRowText}>{t("reminderList.soundRow", { value: settings?.sound ?? "default" })}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.primaryContainer} />
                  <Text style={styles.modalRowText}>{t("reminderList.vibrateRow", { value: settings?.vibrate ? "ON" : "OFF" })}</Text>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>
              {t("reminderList.scheduledNotifs", { value: loading ? "..." : scheduled.length })}
            </Text>
            {!loading && scheduled.length === 0 ? (
              <Text style={styles.modalEmpty}>
                {t("reminderList.noScheduled")}
              </Text>
            ) : null}
            <ScrollView style={styles.modalList} nestedScrollEnabled>
              {scheduled.slice(0, 20).map((item) => (
                <View key={item.id} style={styles.modalListItem}>
                  <Text style={styles.modalListTime}>{formatFireLine(item.fireAt, t)}</Text>
                  <Text style={styles.modalListTitle} numberOfLines={1}>{item.title}</Text>
                  {item.body ? (
                    <Text style={styles.modalListBody} numberOfLines={2}>{item.body}</Text>
                  ) : null}
                </View>
              ))}
              {scheduled.length > 20 ? (
                <Text style={styles.modalEmpty}>{t("reminderList.moreNotifs", { count: scheduled.length - 20 })}</Text>
              ) : null}
            </ScrollView>
          </View>

          <View style={styles.modalActions}>
            <Pressable style={styles.modalActionSecondary} onPress={onClose}>
              <Text style={styles.modalActionSecondaryText}>{t("common.close")}</Text>
            </Pressable>
            <Pressable style={styles.modalActionPrimary} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color={colors.onPrimary} />
              <Text style={styles.modalActionPrimaryText}>{t("common.edit")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function buildSortKey(dateText: string | null | undefined, timeText: string | null | undefined): string {
  return `${dateText ?? "9999-12-31"}T${timeText ?? "23:59:59"}`;
}

function compareTasks(left: Task, right: Task): number {
  return buildSortKey(left.date, left.time).localeCompare(buildSortKey(right.date, right.time));
}

function compareActivities(left: Activity, right: Activity): number {
  return buildSortKey(left.tanggal, left.time_start).localeCompare(buildSortKey(right.tanggal, right.time_start));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fonts["700"],
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  heroCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.onSurface,
    fontSize: 14,
    fontFamily: fonts["700"],
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: typography.bodySm.fontFamily,
  },
  tabSummary: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fonts["700"],
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontFamily: fonts["500"],
    textAlign: "center",
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
  },
  cardBody: {
    flex: 1,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitleTextBlock: {
    flex: 1,
    gap: 2,
  },
  cardIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  cardSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.onSurface,
    fontSize: 10,
    fontFamily: fonts["700"],
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    minWidth: 0,
  },
  detailText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
    flexShrink: 1,
    minWidth: 0,
  },
  messageText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: colors.onSurface,
    fontSize: 12,
    fontFamily: fonts["500"],
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
  },
  metaChipText: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontFamily: fonts["500"],
  },
  emptyState: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.bodySm.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontFamily: fonts["700"],
    flex: 1,
  },
  modalSection: {
    gap: 8,
  },
  modalSectionLabel: {
    color: colors.primaryContainer,
    fontSize: 11,
    fontFamily: fonts["700"],
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalRowText: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: typography.bodySm.fontFamily,
    flex: 1,
  },
  modalEmpty: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: typography.bodySm.fontFamily,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  modalList: {
    maxHeight: 240,
  },
  modalListItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
    gap: 2,
  },
  modalListTime: {
    color: colors.primaryContainer,
    fontSize: 12,
    fontFamily: fonts["700"],
  },
  modalListTitle: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: fonts["600"],
  },
  modalListBody: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: typography.bodySm.fontFamily,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalActionSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionSecondaryText: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: fonts["600"],
  },
  modalActionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
  },
  modalActionPrimaryText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontFamily: fonts["700"],
  },
});
