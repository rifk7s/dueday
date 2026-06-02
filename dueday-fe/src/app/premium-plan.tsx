import { apiFetch } from "@/api/client";
import {
  formatDateLabel,
  getPendingPaymentTransferParams,
  planDurationFor,
  planLabel,
  type PlanValue,
  type PremiumMode,
  type Subscription,
} from "@/api/payments";
import { useSession } from "@/auth/ctx";
import { goBackOr } from "@/constants/navigation";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BenefitItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
};

type PlanItem = {
  value: PlanValue;
  label: string;
  duration: string;
  price: string;
  amount: number;
  note: string;
};

export default function PremiumPlanScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode = "upgrade" } = useLocalSearchParams<{ mode?: PremiumMode }>();
  const isViewMode = mode === "view";
  const isExtendMode = mode === "extend";
  const { token, user } = useSession();
  const MOCK_AUTH = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";
  const { top, bottom } = useSafeAreaInsets();

  // Defined inside the component (memoized per language) so labels can use t().
  // Prices/amounts are data; only label/duration/note are translated.
  const plans = useMemo<PlanItem[]>(() => [
    {
      value: "satu_bulan",
      label: t("premiumPlan.plan1Label"),
      duration: t("premiumPlan.plan1Duration"),
      price: "Rp20.000",
      amount: 20000,
      note: t("premiumPlan.plan1Note"),
    },
    {
      value: "tiga_bulan",
      label: t("premiumPlan.plan2Label"),
      duration: t("premiumPlan.plan2Duration"),
      price: "Rp54.000",
      amount: 54000,
      note: t("premiumPlan.plan2Note"),
    },
    {
      value: "satu_tahun",
      label: t("premiumPlan.plan3Label"),
      duration: t("premiumPlan.plan3Duration"),
      price: "Rp192.000",
      amount: 192000,
      note: t("premiumPlan.plan3Note"),
    },
  ], [t]);

  const benefits = useMemo<BenefitItem[]>(() => [
    {
      icon: "infinite-outline",
      title: t("premiumPlan.benefit1Title"),
      description: t("premiumPlan.benefit1Desc"),
    },
    {
      icon: "notifications-outline",
      title: t("premiumPlan.benefit2Title"),
      description: t("premiumPlan.benefit2Desc"),
    },
  ], [t]);

  const [selectedValue, setSelectedValue] = useState<PlanValue>("satu_bulan");
  const selectedPlan = plans.find((plan) => plan.value === selectedValue) ?? plans[0];

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", token],
    queryFn: async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        return await apiFetch<Subscription[]>("/subscriptions", token!, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    },
    enabled: isViewMode && !!token && !MOCK_AUTH,
    staleTime: 30_000,
    retry: 0,
  });

  const activeSubscription = React.useMemo<Subscription | null>(() => {
    const list = subscriptionsQuery.data;
    if (!list) return null;
    return [...list]
      .filter((s) => s.status === "active" && s.plan != null)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  }, [subscriptionsQuery.data]);

  const activePlanItem = React.useMemo<PlanItem | null>(() => {
    if (!activeSubscription?.plan) return null;
    return plans.find((plan) => plan.value === activeSubscription.plan) ?? null;
  }, [activeSubscription, plans]);

  const isLoadingActive = subscriptionsQuery.isFetching && !activePlanItem;
  const hasFetchError = subscriptionsQuery.isError && !activeSubscription;

  const activePlanName = activePlanItem?.label ?? (activeSubscription?.plan ? planLabel(activeSubscription.plan) : null);
  const activePlanDuration = activePlanItem?.duration ?? (activeSubscription?.plan ? planDurationFor(activeSubscription.plan) : null);
  const activeUntil = activeSubscription?.expired_at ?? user?.subscription_end ?? null;
  const activeUntilLabel = formatDateLabel(activeUntil);

  const handleStartPremium = async (): Promise<void> => {
    if (token && !MOCK_AUTH) {
      try {
        const pendingPayment = await getPendingPaymentTransferParams(token);

        if (pendingPayment) {
          router.push({
            pathname: "/detail-transfer",
            params: pendingPayment,
          });
          return;
        }
      } catch {
        // Ignore lookup failures and continue to the standard payment flow.
      }
    }

    router.push({
      pathname: "/payment",
      params: {
        mode: isExtendMode ? "extend" : "upgrade",
        plan: selectedPlan.value,
        planName: selectedPlan.label,
        planPrice: selectedPlan.price,
        planAmount: String(selectedPlan.amount),
        planDuration: selectedPlan.duration,
      },
    });
  };

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => goBackOr("/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </Pressable>

        <Text style={styles.headerTitle}>DueDay Premium</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIconWrap}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="star" size={34} color={colors.primaryContainer} />
          </View>
        </View>

        <Text style={styles.heroLabel}>{isViewMode ? t("premiumPlan.heroView") : isExtendMode ? t("premiumPlan.heroExtend") : t("premiumPlan.heroUpgrade")}</Text>
        {isViewMode ? (
          activePlanName ? (
            <Text style={styles.price}>{activePlanName}</Text>
          ) : isLoadingActive ? (
            <View style={[styles.skeletonBar, styles.skeletonPrice]} />
          ) : (
            <Text style={styles.price}>{t("premiumPlan.premiumActive")}</Text>
          )
        ) : (
          <Text style={styles.price}>{selectedPlan.price}</Text>
        )}
        {isViewMode ? (
          activePlanDuration ? (
            <Text style={styles.subTitle}>
              {activePlanDuration}
              {activeUntilLabel ? ` · ${t("premiumPlan.validUntil", { date: activeUntilLabel })}` : ""}
            </Text>
          ) : isLoadingActive ? (
            <View style={[styles.skeletonBar, styles.skeletonSubtitle]} />
          ) : (
            <Text style={styles.subTitle}>
              {activeUntilLabel ? t("premiumPlan.validUntil", { date: activeUntilLabel }) : t("premiumPlan.activeNow")}
            </Text>
          )
        ) : (
          <Text style={styles.subTitle}>{isExtendMode ? t("premiumPlan.extendDuration", { duration: selectedPlan.duration }) : t("premiumPlan.activeFor", { duration: selectedPlan.duration })}</Text>
        )}

        {isViewMode || isExtendMode ? (
          <View style={styles.activePlanCard}>
            <View style={styles.activePlanHeader}>
              <View style={styles.activePlanBadge}>
                <Text style={styles.activePlanBadgeText}>{isLoadingActive ? t("premiumPlan.badgeLoading") : isExtendMode ? t("premiumPlan.badgeExtend") : t("premiumPlan.badgeActive")}</Text>
              </View>
              {activePlanName ? (
                <Text style={styles.activePlanTitle}>{activePlanName}</Text>
              ) : isLoadingActive ? (
                <View style={[styles.skeletonBar, styles.skeletonTitle]} />
              ) : (
                <Text style={styles.activePlanTitle}>{t("premiumPlan.premiumActive")}</Text>
              )}
            </View>
            {activeUntilLabel ? (
              <View style={styles.activePlanMetaRow}>
                <Text style={styles.activePlanMetaLabel}>{t("premiumPlan.validUntilLabel")}</Text>
                <Text style={styles.activePlanMetaValue}>{activeUntilLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isViewMode && hasFetchError ? (
          <Pressable
            style={({ pressed }) => [styles.retryRow, pressed && styles.retryRowPressed]}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void subscriptionsQuery.refetch()}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.onErrorContainer} />
            <Text style={styles.retryText}>{t("premiumPlan.loadPlanFailed")}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>{isViewMode ? t("premiumPlan.sectionView") : isExtendMode ? t("premiumPlan.sectionExtend") : t("premiumPlan.sectionUpgrade")}</Text>

        <View style={styles.benefitList}>
          {benefits.map((item) => (
            <View key={item.title} style={styles.benefitCard}>
              <View style={styles.benefitAccent} />
              <View style={styles.benefitContent}>
                <View style={styles.benefitIconWrap}>
                  <Ionicons name={item.icon} size={18} color={colors.primaryContainer} />
                </View>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitTitle}>{item.title}</Text>
                  <Text style={styles.benefitDescription}>{item.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.socialProofPill}>
          <Text style={styles.socialProofText}>{t("premiumPlan.socialProof")}</Text>
        </View>

        {isViewMode ? null : (
          <View style={[styles.paymentCard, { marginBottom: 16 }]}>
            <Text style={styles.paymentLabel}>{isExtendMode ? t("premiumPlan.choosePlanExtend") : t("premiumPlan.choosePlan")}</Text>
            <View style={styles.paymentMethods}>
              {plans.map((plan) => {
                const isSelected = selectedValue === plan.value;

                return (
                  <Pressable
                    key={plan.value}
                    style={isSelected ? styles.paymentMethodActive : styles.paymentMethod}
                    onPress={() => setSelectedValue(plan.value)}
                  >
                    <Text style={isSelected ? styles.paymentMethodActiveText : styles.paymentMethodText}>
                      {plan.duration}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.paymentNote}>{selectedPlan.note}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          accessibilityRole="button"
          onPress={() => {
            if (isViewMode) {
              goBackOr("/(tabs)/profile");
              return;
            }

            void handleStartPremium();
          }}
        >
          <Text style={styles.ctaText}>{isViewMode ? t("premiumPlan.ctaView") : isExtendMode ? t("premiumPlan.ctaExtend") : t("premiumPlan.ctaUpgrade")}</Text>
        </Pressable>
        <Text style={styles.footerNote}>{isViewMode ? t("premiumPlan.footerView") : isExtendMode ? t("premiumPlan.footerExtend") : t("premiumPlan.footerUpgrade")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  header: {
    minHeight: 56,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  heroIconWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  price: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 26,
    fontFamily: fonts["800"],
    color: colors.primaryContainer,
  },
  subTitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: typography.bodyLg.fontSize,
    fontFamily: typography.bodyLg.fontFamily,
    color: colors.onSurfaceVariant,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: typography.labelBold.fontSize,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    letterSpacing: 0.7,
  },
  benefitList: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  benefitAccent: {
    width: 4,
    backgroundColor: colors.primaryContainer,
  },
  benefitContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  benefitDescription: {
    marginTop: 4,
    fontSize: typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: typography.bodySm.fontFamily,
    color: colors.onSurfaceVariant,
  },
  socialProofPill: {
    alignSelf: "center",
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.surfaceContainerLowest,
  },
  socialProofText: {
    fontSize: 12,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
  },
  paymentCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    padding: 16,
  },
  activePlanCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    gap: 8,
  },
  activePlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activePlanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
  },
  activePlanBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontFamily: fonts["700"],
  },
  activePlanTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  activePlanDescription: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.bodySm.fontFamily,
  },
  activePlanMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  activePlanMetaLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontFamily: fonts["600"],
  },
  activePlanMetaValue: {
    color: colors.onSurface,
    fontSize: 12,
    fontFamily: fonts["700"],
    textAlign: "right",
  },
  skeletonBar: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 6,
    alignSelf: "center",
  },
  skeletonPrice: {
    marginTop: 4,
    width: 160,
    height: 26,
  },
  skeletonSubtitle: {
    marginTop: 8,
    width: 220,
    height: typography.bodyLg.fontSize,
  },
  skeletonTitle: {
    alignSelf: "flex-start",
    width: 120,
    height: 15,
  },
  skeletonMeta: {
    width: 80,
    height: 12,
  },
  retryRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.errorContainer,
  },
  retryRowPressed: {
    opacity: 0.7,
  },
  retryText: {
    fontSize: 12,
    fontFamily: fonts["600"],
    color: colors.onErrorContainer,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 10,
  },
  paymentMethodActive: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  paymentMethodActiveText: {
    fontSize: 13,
    fontFamily: fonts["700"],
    color: colors.onPrimary,
  },
  paymentMethod: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  paymentMethodText: {
    fontSize: 13,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  paymentNote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
  },
  ctaButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryContainer,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fonts["800"],
    color: colors.onPrimary,
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
});