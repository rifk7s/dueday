import { type Activity } from "@/api/activities";
import { fromApiDate, fromApiTime } from "@/api/format";
import { type Task } from "@/api/tasks";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useCurrentUserQuery } from "@/hooks/useCurrentUser";
import { useTasksQuery } from "@/hooks/useTasks";
import { cancelByIdentifierPrefix, ensureNotificationPermission, scheduleReminder } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeedType = "task" | "activity";

type FeedItem = {
  id: string;
  type: FeedType;
  title: string;
  subtitle: string;
  dueLabel: string;
  dueAt: Date;
  tone: "overdue" | "soon" | "today" | "done";
  accentColor: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  actionLabel: string;
  sourceId: string;
};


function isTaskDone(status: Task["status"]): boolean {
  return status === "completed" || status === "completed_late";
}

function isActivityDone(status: Activity["status"]): boolean {
  return status === "completed" || status === "cancelled";
}

function parseDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date) return null;

  const normalizedTime = time ?? "23:59:59";
  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDeadlineLabel(date: string | null | undefined, time: string | null | undefined): string {
  const dateLabel = fromApiDate(date);
  const timeLabel = fromApiTime(time);
  return [dateLabel, timeLabel].filter(Boolean).join(" | ") || "Jadwal belum diatur";
}

function extractTriggerDate(trigger: unknown): Date | null {
  if (!trigger || typeof trigger !== "object") return null;

  const payload = trigger as Record<string, unknown>;

  if (typeof payload.value === "number") {
    const ms = payload.value > 1e11 ? payload.value : payload.value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const components = payload.dateComponents as Record<string, number | undefined> | undefined;
  if (components && typeof components === "object") {
    const year = components.year ?? new Date().getFullYear();
    const month = (components.month ?? 1) - 1;
    const day = components.day ?? 1;
    const hour = components.hour ?? 0;
    const minute = components.minute ?? 0;
    const second = components.second ?? 0;
    const date = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (payload.date != null) {
    const raw = payload.date as string | number | Date;
    const date = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function sameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export default function NotificationsScreen(): React.JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesQuery();
  const { data: user, isLoading: userLoading } = useCurrentUserQuery();

  const feedItems = useMemo<FeedItem[]>(() => {
    const now = new Date();

    const taskItems = tasks
      .filter((task) => !isTaskDone(task.status))
      .map((task) => buildTaskFeedItem(task, now));

    const activityItems = activities
      .filter((activity) => !isActivityDone(activity.status))
      .map((activity) => buildActivityFeedItem(activity, now));

    return [...taskItems, ...activityItems].sort((left, right) => {
      const toneRank = toneOrder(left.tone) - toneOrder(right.tone);
      if (toneRank !== 0) return toneRank;
      return left.dueAt.getTime() - right.dueAt.getTime();
    });
  }, [activities, tasks]);

  const totalCount = feedItems.length;
  const loading = tasksLoading || activitiesLoading;

  const [premiumScheduled, setPremiumScheduled] = useState<boolean | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const PREMIUM_PREFIX = "reminder:premium:";

  useEffect(() => {
    let active = true;
    if (!user || user.status !== "subscribed") {
      setPremiumScheduled(null);
      return;
    }

    Notifications.getAllScheduledNotificationsAsync()
      .then((list) => {
        if (!active) return;
        const hasPremium = list.some((n) => n.identifier.startsWith(PREMIUM_PREFIX));
        setPremiumScheduled(hasPremium);
      })
      .catch(() => {
        if (!active) return;
        setPremiumScheduled(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <Stack.Screen options={{ title: "Notifikasi" }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
          </Pressable>

          <Text style={styles.headerTitle}>Notifikasi</Text>

          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.tabSummary}>{totalCount} notifikasi</Text>

        <SectionHeader title="Perlu Dicek" subtitle="Tugas dan aktivitas yang paling dekat tenggatnya" />

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
          </View>
        ) : feedItems.length > 0 ? (
          <View style={styles.cardList}>
            {feedItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Buka ${item.title}`}
                onPress={() => {
                  if (item.type === "task") {
                    router.push({ pathname: "/taskprogress", params: { id: item.sourceId, tab: "tugas" } });
                  } else {
                    router.push({ pathname: "/activityprogress", params: { id: item.sourceId } });
                  }
                }}
                style={[
                  styles.feedCard,
                  item.tone === "overdue" && styles.feedCardOverdue,
                  item.tone === "today" && styles.feedCardToday,
                  item.tone === "soon" && styles.feedCardSoon,
                  item.tone === "done" && styles.feedCardDone,
                ]}
              >
                <View style={[styles.feedAccent, { backgroundColor: item.accentColor }]} />

                <View style={styles.feedBody}>
                  <View style={styles.feedTopRow}>
                    <View style={styles.feedTitleRow}>
                      <View style={[styles.feedIconWrap, { backgroundColor: item.accentColor }]}>
                        <Ionicons name={item.icon} size={16} color={colors.onPrimary} />
                      </View>
                      <View style={styles.feedTitleBlock}>
                        <Text style={styles.feedTitle}>{item.title}</Text>
                        <Text style={styles.feedSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: toneBackground(item.tone) }]}>
                      <Text style={[styles.statusPillText, { color: toneText(item.tone) }]}>{toneLabel(item.tone)}</Text>
                    </View>
                  </View>

                  <Text style={styles.feedDeadline}>{item.dueLabel}</Text>
                  <Text style={styles.feedHint}>{item.actionLabel}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState text="Belum ada notifikasi yang perlu dicek." />
        )}

        {/* Scheduled notifications removed per request */}

        {/* 'Buka Daftar Pengingat' removed per request */}

        {/* Premium expiry section - always visible; content varies by user status */}
        <>
          <SectionHeader title="Langganan Premium" subtitle="Peringatan kedaluwarsa" />
          <View style={styles.cardList}>
            <View style={styles.scheduledCard}>
              <View style={styles.scheduledIconWrap}>
                <Ionicons name="time-outline" size={16} color={colors.primaryContainer} />
              </View>

              <View style={styles.scheduledBody}>
                {user?.status === "subscribed" ? (
                  ((user as any)?.subscription_end ? (
                    <>
                      <Text style={styles.scheduledTitle}>Berakhir pada</Text>
                      <Text style={styles.scheduledBodyText}>{formatScheduledTime(new Date((user as any).subscription_end))}</Text>
                      <Text style={styles.scheduledMeta}>{Math.max(0, Math.ceil((new Date((user as any).subscription_end).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))} hari lagi</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.scheduledTitle}>Tanggal berakhir tidak tersedia</Text>
                      <Text style={styles.scheduledBodyText}>Server belum mengembalikan tanggal akhir langganan.</Text>
                    </>
                  ))) : (
                  <>
                    <Text style={styles.scheduledTitle}>Belum berlangganan</Text>
                    <Text style={styles.scheduledBodyText}>Dapatkan reminder eksklusif dan fitur premium dengan berlangganan.</Text>
                  </>
                )}

                <View style={{ marginTop: 8 }} />

                {user?.status === "subscribed" ? (
                  premiumScheduled ? (
                    <Pressable
                      style={styles.footerButton}
                      onPress={async () => {
                        setScheduling(true);
                        await cancelByIdentifierPrefix(PREMIUM_PREFIX);
                        setPremiumScheduled(false);
                        setScheduling(false);
                      }}
                    >
                      <Text style={styles.footerButtonText}>Batalkan Peringatan Kadaluarsa</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.footerButton}
                      onPress={async () => {
                        setScheduling(true);
                        const granted = await ensureNotificationPermission();
                        if (!granted) {
                          setScheduling(false);
                          return;
                        }

                        await cancelByIdentifierPrefix(PREMIUM_PREFIX);

                        const offsets = (user as any)?.subscription_end ? [7, 1] : [7, 1];
                        const subEnd = (user as any)?.subscription_end ? new Date((user as any).subscription_end) : new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

                        for (const daysBefore of offsets) {
                          const when = new Date(subEnd.getTime() - daysBefore * 24 * 60 * 60 * 1000);
                          if (when.getTime() <= Date.now()) continue;
                          const id = `${PREMIUM_PREFIX}expiry:${subEnd.toISOString().slice(0, 10)}:${daysBefore}`;
                          await scheduleReminder({
                            id,
                            title: "Peringatan Langganan",
                            body: `Langgananmu berakhir dalam ${daysBefore} hari.`,
                            date: when,
                          });
                        }

                        setPremiumScheduled(true);
                        setScheduling(false);
                      }}
                    >
                      <Text style={styles.footerButtonText}>{scheduling ? "Menjadwalkan..." : "Jadwalkan Peringatan Kadaluarsa"}</Text>
                    </Pressable>
                  )
                ) : (
                  <Pressable style={styles.footerButton} onPress={() => router.push("/premium-plan")}>
                    <Text style={styles.footerButtonText}>Lihat Paket Premium</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </>
      </ScrollView>
    </View>
  );
}

function buildTaskFeedItem(task: Task, now: Date): FeedItem {
  const dueAt = parseDateTime(task.date, task.time) ?? new Date(8640000000000000);
  const overdue = task.is_overdue ?? (task.date ? dueAt.getTime() < now.getTime() : false);
  const tone = overdue ? "overdue" : sameDay(dueAt, now) ? "today" : isWithinDays(dueAt, now, 3) ? "soon" : "soon";

  return {
    id: `task-${task.id}`,
    type: "task",
    title: task.task_name,
    subtitle: task.tag?.nama_tag ? `Tugas · ${task.tag.nama_tag}` : "Tugas aktif",
    dueLabel: formatDeadlineLabel(task.date, task.time),
    dueAt,
    tone,
    accentColor: overdue ? colors.errorStrong : colors.primaryContainer,
    icon: overdue ? "warning" : "document-text-outline",
    actionLabel: overdue ? "Segera buka detail tugas ini." : "Tap untuk melihat progres tugas.",
    sourceId: task.id,
  };
}

function buildActivityFeedItem(activity: Activity, now: Date): FeedItem {
  const dueAt = parseDateTime(activity.tanggal, activity.time_start) ?? new Date(8640000000000000);
  const overdue = activity.status !== "completed" && activity.status !== "cancelled" && dueAt.getTime() < now.getTime();
  const tone = overdue ? "overdue" : sameDay(dueAt, now) ? "today" : isWithinDays(dueAt, now, 3) ? "soon" : "soon";

  return {
    id: `activity-${activity.id}`,
    type: "activity",
    title: activity.activity_name,
    subtitle: activity.tag?.nama_tag ? `Aktivitas · ${activity.tag.nama_tag}` : "Aktivitas aktif",
    dueLabel: formatDeadlineLabel(activity.tanggal, activity.time_start),
    dueAt,
    tone,
    accentColor: overdue ? colors.errorStrong : colors.secondaryContainer,
    icon: overdue ? "alert-circle-outline" : "sparkles-outline",
    actionLabel: overdue ? "Aktivitas ini sudah lewat jadwal." : "Tap untuk melihat detail aktivitas.",
    sourceId: activity.id,
  };
}

function isWithinDays(target: Date, now: Date, days: number): boolean {
  const diff = target.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function toneOrder(tone: FeedItem["tone"]): number {
  if (tone === "overdue") return 0;
  if (tone === "today") return 1;
  if (tone === "soon") return 2;
  return 3;
}

function toneLabel(tone: FeedItem["tone"]): string {
  if (tone === "overdue") return "TERLAMBAT";
  if (tone === "today") return "HARI INI";
  if (tone === "soon") return "SEGERA";
  return "SELESAI";
}

function toneBackground(tone: FeedItem["tone"]): string {
  if (tone === "overdue") return colors.errorSoft;
  if (tone === "today") return colors.surfaceWarm;
  if (tone === "soon") return colors.surfaceContainerLow;
  return colors.surfaceSuccess;
}

function toneText(tone: FeedItem["tone"]): string {
  if (tone === "overdue") return colors.errorStrong;
  if (tone === "today") return colors.warning;
  if (tone === "soon") return colors.onSurfaceVariant;
  return colors.success;
}

function formatScheduledTime(date: Date): string {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = dayNames[date.getDay()] ?? "";
  const month = monthNames[date.getMonth()] ?? "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()} · ${hh}:${mm}`;
}

function SectionHeader({ title, subtitle }: Readonly<{ title: string; subtitle: string }>): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function StatCard({ label, value, icon }: Readonly<{ label: string; value: number; icon: React.ComponentProps<typeof Ionicons>["name"] }>): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={colors.onPrimary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: Readonly<{ text: string }>): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={22} color={colors.iconSubtle} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
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
  
  /* Stat card used by small summary cards */
  statCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fonts["800"],
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  tabSummary: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow,
    padding: 18,
  },
  heroTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: colors.onSurface,
    fontSize: typography.h3.fontSize,
    fontFamily: typography.h3.fontFamily,
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodyLg.fontSize,
    lineHeight: 22,
    fontFamily: typography.bodyLg.fontFamily,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: typography.h3.fontSize,
    fontFamily: typography.h3.fontFamily,
  },
  sectionSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.bodySm.fontFamily,
  },
  loadingState: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardList: {
    gap: 12,
  },
  feedCard: {
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  feedCardOverdue: {
    backgroundColor: colors.errorSoft,
  },
  feedCardToday: {
    backgroundColor: colors.surfaceWarm,
  },
  feedCardSoon: {
    backgroundColor: colors.surfaceContainerLow,
  },
  feedCardDone: {
    backgroundColor: colors.surfaceSuccess,
  },
  feedAccent: {
    width: 5,
  },
  feedBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  feedTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  feedTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  feedIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  feedTitleBlock: {
    flex: 1,
    gap: 2,
  },
  feedTitle: {
    color: colors.onSurface,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts["800"],
  },
  feedSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts["500"],
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: fonts["800"],
    letterSpacing: 0.5,
  },
  feedDeadline: {
    color: colors.onSurface,
    fontSize: 14,
    fontFamily: fonts["700"],
  },
  feedHint: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts["500"],
  },
  scheduledCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  scheduledIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduledBody: {
    flex: 1,
    gap: 4,
  },
  scheduledTitle: {
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  scheduledBodyText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts["500"],
  },
  scheduledTime: {
    color: colors.primaryContainer,
    fontSize: 12,
    fontFamily: fonts["600"],
  },
  scheduledMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: fonts["500"],
  },
  footerButton: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  footerButtonText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontFamily: fonts["800"],
  },
});