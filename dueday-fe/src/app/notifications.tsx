import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useCurrentUserQuery } from "@/hooks/useCurrentUser";
import { useNotificationState } from "@/hooks/useNotificationState";
import { useTasksQuery } from "@/hooks/useTasks";
import {
  BUCKET_ORDER,
  bucketLabel,
  buildNotifications,
  type NotificationItem,
  type TimeBucket,
} from "@/lib/notificationFeed";
import { cancelByIdentifierPrefix, ensureNotificationPermission, scheduleReminder } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { LinearTransition, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PREMIUM_PREFIX = "reminder:premium:";
const DISMISS_ACTION_WIDTH = 96;
// The real DueDay app mark — same icon the OS shows on a delivered notification.
const APP_ICON = require("@/assets/images/icon.png");

export default function NotificationsScreen(): React.JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesQuery();
  const { data: user } = useCurrentUserQuery();
  const { ready, isRead, isDismissed, markRead, markAllRead, dismiss, prune } = useNotificationState();

  const allItems = useMemo(() => buildNotifications(tasks, activities, user, new Date()), [tasks, activities, user]);

  // Drop persisted read/dismissed ids that no longer map to a live notification.
  useEffect(() => {
    if (!ready) return;
    prune(allItems.map((item) => item.id));
  }, [ready, allItems, prune]);

  const visible = useMemo(() => allItems.filter((item) => !isDismissed(item.id)), [allItems, isDismissed]);

  const grouped = useMemo(() => {
    const map = new Map<TimeBucket, NotificationItem[]>();
    for (const item of visible) {
      const arr = map.get(item.bucket);
      if (arr) arr.push(item);
      else map.set(item.bucket, [item]);
    }
    return map;
  }, [visible]);

  const unreadIds = useMemo(
    () => visible.filter((item) => item.kind !== "premium" && !isRead(item.id)).map((item) => item.id),
    [visible, isRead],
  );

  const loading = tasksLoading || activitiesLoading;

  const handleOpen = useCallback(
    (item: NotificationItem) => {
      markRead(item.id);
      if (item.kind === "task") {
        router.push({ pathname: "/taskprogress", params: { id: item.sourceId ?? "", tab: "tugas" } });
      } else if (item.kind === "activity") {
        router.push({ pathname: "/activityprogress", params: { id: item.sourceId ?? "" } });
      } else if (item.kind === "summary") {
        router.push("/list");
      }
    },
    [markRead, router],
  );

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

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {unreadIds.length > 0 ? `${unreadIds.length} belum dibaca` : "Semua sudah dibaca"}
          </Text>
          {unreadIds.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tandai semua dibaca"
              onPress={() => markAllRead(unreadIds)}
              hitSlop={8}
            >
              <Text style={styles.summaryAction}>Tandai semua dibaca</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          BUCKET_ORDER.map((bucket) => {
            const items = grouped.get(bucket);
            if (!items || items.length === 0) return null;
            return (
              <BucketSection key={bucket} bucket={bucket} count={items.length}>
                {items.map((item) =>
                  item.kind === "premium" ? (
                    <PremiumCard key={item.id} item={item} />
                  ) : (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      unread={!isRead(item.id)}
                      onOpen={handleOpen}
                      onDismiss={dismiss}
                    />
                  ),
                )}
              </BucketSection>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function BucketSection({
  bucket,
  count,
  children,
}: Readonly<{ bucket: TimeBucket; count: number; children: React.ReactNode }>): React.JSX.Element {
  return (
    <Reanimated.View layout={LinearTransition} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{bucketLabel(bucket)}</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      </View>
      <View style={styles.cardList}>{children}</View>
    </Reanimated.View>
  );
}

function NotificationCard({
  item,
  unread,
  onOpen,
  onDismiss,
}: Readonly<{
  item: NotificationItem;
  unread: boolean;
  onOpen: (item: NotificationItem) => void;
  onDismiss: (id: string) => void;
}>): React.JSX.Element {
  return (
    <Reanimated.View layout={LinearTransition}>
      <Swipeable
        friction={2}
        rightThreshold={40}
        renderRightActions={(_progress, translation) => <DismissAction drag={translation} />}
        onSwipeableOpen={() => onDismiss(item.id)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buka ${item.title}`}
          onPress={() => onOpen(item)}
          style={[styles.card, unread && styles.cardUnread]}
        >
          <Image source={APP_ICON} style={styles.appIcon} resizeMode="cover" />
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardTime}>{item.timeLabel}</Text>
            </View>
            <Text style={styles.cardMessage} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          {unread ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </Swipeable>
    </Reanimated.View>
  );
}

function DismissAction({ drag }: Readonly<{ drag: SharedValue<number> }>): React.JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + DISMISS_ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={[styles.dismissAction, animatedStyle]}>
      <Ionicons name="close-circle-outline" size={20} color={colors.onPrimary} />
      <Text style={styles.dismissActionText}>Tutup</Text>
    </Reanimated.View>
  );
}

function PremiumCard({ item }: Readonly<{ item: NotificationItem }>): React.JSX.Element {
  const router = useRouter();
  const expired = item.premium?.expired ?? false;
  const subscriptionEnd = item.premium?.subscriptionEnd ?? null;

  const [premiumScheduled, setPremiumScheduled] = useState<boolean | null>(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    let active = true;
    if (expired) {
      setPremiumScheduled(null);
      return;
    }
    Notifications.getAllScheduledNotificationsAsync()
      .then((list) => {
        if (!active) return;
        setPremiumScheduled(list.some((n) => n.identifier.startsWith(PREMIUM_PREFIX)));
      })
      .catch(() => {
        if (active) setPremiumScheduled(false);
      });
    return () => {
      active = false;
    };
  }, [expired]);

  const onSchedule = useCallback(async () => {
    setScheduling(true);
    const granted = await ensureNotificationPermission();
    if (!granted) {
      setScheduling(false);
      return;
    }
    await cancelByIdentifierPrefix(PREMIUM_PREFIX);

    const subEnd = subscriptionEnd ? new Date(subscriptionEnd) : new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    for (const daysBefore of [7, 1]) {
      const when = new Date(subEnd.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      if (when.getTime() <= Date.now()) continue;
      await scheduleReminder({
        id: `${PREMIUM_PREFIX}expiry:${subEnd.toISOString().slice(0, 10)}:${daysBefore}`,
        title: "Peringatan Langganan",
        body: `Langgananmu berakhir dalam ${daysBefore} hari.`,
        date: when,
      });
    }
    setPremiumScheduled(true);
    setScheduling(false);
  }, [subscriptionEnd]);

  const onCancel = useCallback(async () => {
    setScheduling(true);
    await cancelByIdentifierPrefix(PREMIUM_PREFIX);
    setPremiumScheduled(false);
    setScheduling(false);
  }, []);

  return (
    <View style={[styles.card, styles.premiumCard]}>
      <View style={styles.premiumTop}>
        <Image source={APP_ICON} style={styles.appIcon} resizeMode="cover" />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.timeLabel ? <Text style={styles.cardTime}>{item.timeLabel}</Text> : null}
          </View>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {item.body}
          </Text>
        </View>
      </View>

      {expired ? (
        <Pressable style={styles.premiumButton} onPress={() => router.push("/premium-plan")}>
          <Text style={styles.premiumButtonText}>Perpanjang Premium</Text>
        </Pressable>
      ) : premiumScheduled ? (
        <Pressable style={styles.premiumButton} onPress={onCancel} disabled={scheduling}>
          <Text style={styles.premiumButtonText}>{scheduling ? "Memproses..." : "Batalkan Peringatan Kadaluarsa"}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.premiumButton} onPress={onSchedule} disabled={scheduling}>
          <Text style={styles.premiumButtonText}>{scheduling ? "Menjadwalkan..." : "Jadwalkan Peringatan Kadaluarsa"}</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-off-outline" size={26} color={colors.success} />
      </View>
      <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
      <Text style={styles.emptyText}>Pemberitahuan tugas, aktivitas, dan langgananmu akan muncul di sini.</Text>
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
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -6,
  },
  summaryText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontFamily: fonts["500"],
  },
  summaryAction: {
    color: colors.primaryContainer,
    fontSize: 13,
    fontFamily: fonts["700"],
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: typography.h3.fontSize,
    fontFamily: typography.h3.fontFamily,
  },
  sectionCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCountText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["700"],
  },
  cardList: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: colors.surfaceContainerLow,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainerHigh,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts["700"],
  },
  cardTitleUnread: {
    fontFamily: fonts["800"],
  },
  cardTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["500"],
  },
  cardMessage: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts["500"],
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
  },
  dismissAction: {
    width: DISMISS_ACTION_WIDTH,
    backgroundColor: colors.primaryContainer,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginLeft: 10,
  },
  dismissActionText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontFamily: fonts["700"],
  },
  premiumCard: {
    flexDirection: "column",
    gap: 12,
  },
  premiumTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  premiumButton: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumButtonText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontFamily: fonts["800"],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSuccess,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontFamily: fonts["700"],
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: fonts["500"],
  },
});
