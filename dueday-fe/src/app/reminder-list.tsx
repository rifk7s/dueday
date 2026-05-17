import { ULANGI_DISPLAY, type Activity } from "@/api/activities";
import { fromApiDate, fromApiTime } from "@/api/format";
import { PRIORITY_DISPLAY, type Task } from "@/api/tasks";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReminderCardItem = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  timeLabel: string;
  badgeLabel: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accentColor: string;
  badgeBackground: string;
};

type ReminderTab = "tasks" | "activities";

export default function ReminderListScreen(): JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: tasks = [] } = useTasksQuery();
  const { data: activities = [] } = useActivitiesQuery();
  const [activeTab, setActiveTab] = React.useState<ReminderTab>("tasks");

  const taskReminders = React.useMemo<ReminderCardItem[]>(() => {
    return [...tasks]
      .filter((task) => task.status !== "completed")
      .sort(compareTasks)
      .map((task) => createTaskReminder(task));
  }, [tasks]);

  const activityReminders = React.useMemo<ReminderCardItem[]>(() => {
    return [...activities]
      .filter((activity) => activity.status !== "completed")
      .sort(compareActivities)
      .map((activity) => createActivityReminder(activity));
  }, [activities]);

  const activeCount = activeTab === "tasks" ? taskReminders.length : activityReminders.length;

  return (
    <View style={[styles.safeArea, { paddingTop: top, paddingBottom: bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Text style={styles.title}>Reminder List</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="notifications-outline" size={22} color={colors.primaryContainer} />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Daftar pengingat terdekat</Text>
            <Text style={styles.heroSubtitle}>
              Tugas dan aktivitas yang belum selesai muncul di sini.
            </Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <ReminderTabButton
            label="Tugas"
            count={taskReminders.length}
            active={activeTab === "tasks"}
            onPress={() => setActiveTab("tasks")}
          />
          <ReminderTabButton
            label="Aktivitas"
            count={activityReminders.length}
            active={activeTab === "activities"}
            onPress={() => setActiveTab("activities")}
          />
        </View>

        <Text style={styles.tabSummary}>{activeCount} reminder di tab ini</Text>

        {activeTab === "tasks" ? (
          <ReminderSection
            title="Tugas"
            icon="document-text-outline"
            items={taskReminders}
            emptyText="Belum ada tugas yang perlu diingat."
          />
        ) : (
          <ReminderSection
            title="Aktivitas"
            icon="sparkles-outline"
            items={activityReminders}
            emptyText="Belum ada aktivitas yang perlu diingat."
          />
        )}
      </ScrollView>
    </View>
  );
}

type ReminderTabButtonProps = {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

function ReminderTabButton({ label, count, active, onPress }: Readonly<ReminderTabButtonProps>): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonLabel, active && styles.tabButtonLabelActive]}>{label}</Text>
      <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
        <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

type ReminderSectionProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  items: ReminderCardItem[];
  emptyText: string;
};

function ReminderSection({ title, icon, items, emptyText }: Readonly<ReminderSectionProps>): JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={16} color={colors.primaryContainer} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionCount}>{items.length} item</Text>
      </View>

      {items.length > 0 ? (
        items.map((item) => <ReminderCard key={item.id} item={item} />)
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
};

function ReminderCard({ item }: Readonly<ReminderCardProps>): JSX.Element {
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: item.accentColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name={item.icon} size={15} color={colors.primaryContainer} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: item.badgeBackground }]}>
            <Text style={styles.badgeText}>{item.badgeLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.dateLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.timeLabel}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.iconSubtle} />
    </View>
  );
}

function createTaskReminder(task: Task): ReminderCardItem {
  return {
    id: task.id,
    title: task.task_name,
    subtitle: task.deskripsi?.trim() || "Tugas harian",
    dateLabel: fromApiDate(task.date) || "Tanggal belum diatur",
    timeLabel: fromApiTime(task.time) || "Waktu belum diatur",
    badgeLabel: task.priority ? PRIORITY_DISPLAY[task.priority] ?? task.priority.toUpperCase() : "PRIORITAS",
    icon: "document-text-outline",
    accentColor: colors.primaryContainer,
    badgeBackground: colors.surfaceWarm,
  };
}

function createActivityReminder(activity: Activity): ReminderCardItem {
  return {
    id: activity.id,
    title: activity.activity_name,
    subtitle: activity.deskripsi?.trim() || "Aktivitas terjadwal",
    dateLabel: fromApiDate(activity.tanggal) || "Tanggal belum diatur",
    timeLabel: activity.time_start ? `${fromApiTime(activity.time_start)} - ${fromApiTime(activity.time_end) || "--:--"}` : "Waktu belum diatur",
    badgeLabel: activity.ulangi ? ULANGI_DISPLAY[activity.ulangi] : "SATU KALI",
    icon: "sparkles-outline",
    accentColor: colors.secondaryContainer,
    badgeBackground: colors.surfaceContainerLow,
  };
}

function compareTasks(left: Task, right: Task): number {
  return buildSortKey(left.date, left.time).localeCompare(buildSortKey(right.date, right.time));
}

function compareActivities(left: Activity, right: Activity): number {
  return buildSortKey(left.tanggal, left.time_start).localeCompare(buildSortKey(right.tanggal, right.time_start));
}

function buildSortKey(dateText: string | null | undefined, timeText: string | null | undefined): string {
  return `${dateText ?? "9999-12-31"}T${timeText ?? "23:59:59"}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 16,
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
    gap: 12,
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: typography.bodySm.fontFamily,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  tabButtonActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  tabButtonLabel: {
    color: colors.onSurface,
    fontSize: 14,
    fontFamily: fonts["700"],
  },
  tabButtonLabelActive: {
    color: colors.onPrimary,
  },
  tabBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: colors.onPrimary,
  },
  tabBadgeText: {
    color: colors.onSurface,
    fontSize: 11,
    fontFamily: fonts["700"],
  },
  tabBadgeTextActive: {
    color: colors.primaryContainer,
  },
  tabSummary: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontFamily: fonts["700"],
  },
  sectionCount: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["600"],
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
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  cardSubtitle: {
    marginTop: 2,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.bodySm.fontFamily,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
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
});
