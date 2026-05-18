import { type Activity } from "@/api/activities";
import { fromApiDate, fromApiTime } from "@/api/format";
import { type Task } from "@/api/tasks";
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
  label: string;
  count: number;
  nearestDate: string;
  nearestTime: string;
  type: "task" | "activity";
};

export default function ReminderListScreen(): JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: tasks = [] } = useTasksQuery();
  const { data: activities = [] } = useActivitiesQuery();

  const allReminders = React.useMemo<ReminderCardItem[]>(() => {
    const activeTasks = [...tasks].filter((task) => task.status !== "completed").sort(compareTasks);
    const activeActivities = [...activities].filter((activity) => activity.status !== "completed").sort(compareActivities);

    const reminders: ReminderCardItem[] = [];

    if (activeTasks.length > 0) {
      const nearest = activeTasks[0];
      reminders.push({
        id: "tasks-summary",
        label: "Tugas",
        count: activeTasks.length,
        nearestDate: fromApiDate(nearest.date) || "Tanggal belum diatur",
        nearestTime: fromApiTime(nearest.time) || "Waktu belum diatur",
        type: "task",
      });
    }

    if (activeActivities.length > 0) {
      const nearest = activeActivities[0];
      reminders.push({
        id: "activities-summary",
        label: "Aktivitas",
        count: activeActivities.length,
        nearestDate: fromApiDate(nearest.tanggal) || "Tanggal belum diatur",
        nearestTime: nearest.time_start ? fromApiTime(nearest.time_start) : "Waktu belum diatur",
        type: "activity",
      });
    }

    return reminders;
  }, [tasks, activities]);

  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const completedToday = [
      ...tasks.filter((t) => t.status === "completed" && t.date === today),
      ...activities.filter((a) => a.status === "completed" && a.tanggal === today),
    ].length;

    const scheduledThisWeek = [
      ...tasks.filter(
        (t) => t.status !== "completed" && t.date && t.date >= today && t.date <= weekEnd.toISOString().split("T")[0]
      ),
      ...activities.filter(
        (a) => a.status !== "completed" && a.tanggal && a.tanggal >= today && a.tanggal <= weekEnd.toISOString().split("T")[0]
      ),
    ].length;

    const totalCompleted = [...tasks, ...activities].filter((item) => item.status === "completed").length;

    return { completedToday, scheduledThisWeek, totalCompleted };
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

        <Text style={styles.tabSummary}>{allReminders.length} reminder</Text>

        <StatsRow stats={stats} />

        <ReminderSection
          items={allReminders}
          emptyText="Belum ada reminder yang perlu diingat."
        />
      </ScrollView>
    </View>
  );
}

type ReminderSectionProps = {
  items: ReminderCardItem[];
  emptyText: string;
};

type StatsRowProps = {
  stats: {
    completedToday: number;
    scheduledThisWeek: number;
    totalCompleted: number;
  };
};

function StatsRow({ stats }: Readonly<StatsRowProps>): JSX.Element {
  return (
    <View style={styles.statsRow}>
      <StatCard
        icon="checkmark-circle-outline"
        label="Selesai Hari Ini"
        value={stats.completedToday}
        color={colors.primaryContainer}
      />
      <StatCard
        icon="calendar-outline"
        label="Minggu Ini"
        value={stats.scheduledThisWeek}
        color={colors.secondaryContainer}
      />
      <StatCard
        icon="trending-up-outline"
        label="Total Selesai"
        value={stats.totalCompleted}
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

function StatCard({ icon, label, value, color }: Readonly<StatCardProps>): JSX.Element {
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

function ReminderSection({ items, emptyText }: Readonly<ReminderSectionProps>): JSX.Element {
  return (
    <View style={styles.section}>
      {items.length > 0 ? (
        items.map((item) => <ReminderSummaryCard key={item.id} item={item} />)
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

function ReminderSummaryCard({ item }: Readonly<ReminderCardProps>): JSX.Element {
  const accentColor = item.type === "task" ? colors.primaryContainer : colors.secondaryContainer;
  const icon = item.type === "task" ? "document-text-outline" : "sparkles-outline";

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name={icon} size={15} color={accentColor} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{item.count} item menunggu</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit"
          >
            <Ionicons name="pencil" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.nearestDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.nearestTime}</Text>
          </View>
        </View>
      </View>
    </View>
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
