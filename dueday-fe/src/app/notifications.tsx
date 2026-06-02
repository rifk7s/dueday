import { colors, fonts, typography } from "@/constants/theme";
import { useCurrentUserQuery } from "@/hooks/useCurrentUser";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import { useNotificationState } from "@/hooks/useNotificationState";
import {
  BUCKET_ORDER,
  buildDeliveredNotifications,
  buildPremiumItem,
  type NotificationItem,
  type TimeBucket,
} from "@/lib/notificationFeed";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { LinearTransition, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function IconForItem({ kind }: { kind: string }) {
  if (kind === "premium") {
    return (
      <View style={styles.premiumIconWrap}>
        <Ionicons name="diamond" size={18} color={colors.primaryContainer} />
      </View>
    );
  }

  // default: task/activity
  return (
    <View style={styles.taskIconWrap}>
      <Ionicons name="document-text" size={18} color="#fff" />
    </View>
  );
}

const DISMISS_ACTION_WIDTH = 96;

function bucketLabel(bucket: TimeBucket, t: TFunction): string {
  switch (bucket) {
    case "today":
      return t("notifications.bucketToday");
    case "week":
      return t("notifications.bucketWeek");
    case "overdue":
      return t("notifications.bucketOverdue");
  }
}

export default function NotificationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { ready: historyReady, delivered } = useNotificationHistory();
  const { data: user } = useCurrentUserQuery();
  const { ready, isRead, isDismissed, markRead, markAllRead, dismiss, prune } = useNotificationState();

  const allItems = useMemo(() => {
    const now = new Date();
    const items = buildDeliveredNotifications(delivered, now);
    // Premium expiry warning comes from live subscription state, not delivered
    // history — prepend so it pins to the top of "Hari ini".
    const premium = buildPremiumItem(user, now);
    return premium ? [premium, ...items] : items;
  }, [delivered, user]);

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

  const loading = !historyReady;

  const handleOpen = useCallback(
    (item: NotificationItem) => {
      markRead(item.id);
      // Test/manual notifications carry no source id — nothing to navigate to.
      if (item.kind === "task" && item.sourceId) {
        router.push({ pathname: "/taskprogress", params: { id: item.sourceId, tab: "tugas" } });
      } else if (item.kind === "activity" && item.sourceId) {
        router.push({ pathname: "/activityprogress", params: { id: item.sourceId } });
      } else if (item.kind === "summary") {
        router.push("/list");
      }
    },
    [markRead, router],
  );

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <Stack.Screen options={{ title: t("notifications.title") }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 28 }]}
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

          <Text style={styles.headerTitle}>{t("notifications.title")}</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {unreadIds.length > 0 ? t("notifications.unreadCount", { count: unreadIds.length }) : t("notifications.allRead")}
          </Text>
          {unreadIds.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("notifications.markAllRead")}
              onPress={() => markAllRead(unreadIds)}
              hitSlop={8}
            >
              <Text style={styles.summaryAction}>{t("notifications.markAllRead")}</Text>
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
  const { t } = useTranslation();
  return (
    <Reanimated.View layout={LinearTransition} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{bucketLabel(bucket, t)}</Text>
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
  const { t } = useTranslation();
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
          accessibilityLabel={t("notifications.openItem", { title: item.title })}
          onPress={() => onOpen(item)}
          style={[styles.card, unread && styles.cardUnread, styles.cardDefault]}
        >
          <IconForItem kind={item.kind} />
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]}>{item.title}</Text>
              {unread ? <View style={styles.unreadDot} /> : null}
              <Text style={styles.cardTime}>{item.timeLabel}</Text>
            </View>
            <Text style={styles.cardMessage}>{item.body}</Text>
          </View>
          {unread ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </Swipeable>
    </Reanimated.View>
  );
}

function DismissAction({ drag }: Readonly<{ drag: SharedValue<number> }>): React.JSX.Element {
  const { t } = useTranslation();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + DISMISS_ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={[styles.dismissAction, animatedStyle]}>
      <Ionicons name="close-circle-outline" size={20} color={colors.onPrimary} />
      <Text style={styles.dismissActionText}>{t("notifications.dismiss")}</Text>
    </Reanimated.View>
  );
}

function PremiumCard({ item }: Readonly<{ item: NotificationItem }>): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  // Render premium notification using the exact same layout as regular notifications
  // so it visually matches the rest of the feed.
  return (
    <Reanimated.View layout={LinearTransition}>
      <Swipeable
        friction={2}
        rightThreshold={40}
        renderRightActions={(_progress, translation) => <DismissAction drag={translation} />}
        onSwipeableOpen={() => { /* premium items aren't dismissible in current UX */ }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("notifications.openItem", { title: item.title })}
          onPress={() => router.push("/premium-plan")}
          style={[styles.card, styles.cardDefault]}
        >
          <IconForItem kind={item.kind === "premium" ? "premium" : item.kind} />
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.timeLabel ? <Text style={styles.cardTime}>{item.timeLabel}</Text> : null}
            </View>
            <Text style={styles.cardMessage}>{item.body}</Text>
          </View>
        </Pressable>
      </Swipeable>
    </Reanimated.View>
  );
}

function EmptyState(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-off-outline" size={26} color={colors.success} />
      </View>
      <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
      <Text style={styles.emptyText}>{t("notifications.emptyText")}</Text>
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
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardUnread: {
    backgroundColor: colors.surfaceContainerLow,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    flexShrink: 0,
    // Nudge down so it lines up with the title's first line.
    marginTop: 2,
  },
  cardMessage: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts["500"],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
    marginTop: 6,
  },
  cardDefault: {
    backgroundColor: colors.surfaceContainerLowest,
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
