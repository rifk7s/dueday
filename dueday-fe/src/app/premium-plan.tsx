import { apiFetch } from "@/api/client";
import {
  getPendingPaymentTransferParams,
  planDurationFor,
  planLabel,
  type PlanValue,
  type Subscription,
} from "@/api/payments";
import { useSession } from "@/auth/ctx";
import { goBackOr } from "@/constants/navigation";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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

const benefits: BenefitItem[] = [
  {
    icon: "eye-outline",
    title: "Lihat Siapa Duluan Kumpul",
    description: "Monitor siapa yang duluan submit tugas di e-learn, jadi kamu nggak ketinggalan info perkembangan kelas.",
  },
  {
    icon: "notifications-outline",
    title: "Reminder Personalization",
    description: "Reminder otomatis yang menyesuaikan deadline, waktu kosong, dan kebiasaan kamu setiap hari.",
  },
];

const plans: PlanItem[] = [
  {
    value: "satu_bulan",
    label: "Paket 1 Bulan",
    duration: "1 bulan",
    price: "Rp20.000",
    amount: 20000,
    note: "Cocok untuk coba premium dulu.",
  },
  {
    value: "tiga_bulan",
    label: "Paket 3 Bulan",
    duration: "3 bulan",
    price: "Rp54.000",
    amount: 54000,
    note: "Hemat 10% dibanding bayar bulanan.",
  },
  {
    value: "satu_tahun",
    label: "Paket 1 Tahun",
    duration: "12 bulan",
    price: "Rp192.000",
    amount: 192000,
    note: "Pilihan paling hemat untuk pemakaian penuh.",
  },
];

export default function PremiumPlanScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isViewMode = params.mode === "view";
  const { token, user } = useSession();
  const MOCK_AUTH = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";
  const { top, bottom } = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem>(plans[0]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [loadingActiveSubscription, setLoadingActiveSubscription] = useState(false);

  React.useEffect(() => {
    if (!isViewMode || !token || MOCK_AUTH) {
      setActiveSubscription(null);
      return;
    }

    let active = true;
    setLoadingActiveSubscription(true);

    apiFetch<Subscription[]>("/subscriptions", token)
      .then((subscriptions) => {
        if (!active) return;

        const current = [...subscriptions]
          .filter((subscription) => subscription.status === "active" && subscription.plan != null)
          .sort((left, right) => {
            const leftTime = new Date(left.updated_at).getTime();
            const rightTime = new Date(right.updated_at).getTime();
            return rightTime - leftTime;
          })[0] ?? null;

        setActiveSubscription(current);
      })
      .catch(() => {
        if (active) setActiveSubscription(null);
      })
      .finally(() => {
        if (active) setLoadingActiveSubscription(false);
      });

    return () => {
      active = false;
    };
  }, [isViewMode, token, MOCK_AUTH]);

  const activePlanItem = React.useMemo<PlanItem | null>(() => {
    if (!activeSubscription?.plan) return null;
    return plans.find((plan) => plan.value === activeSubscription.plan) ?? null;
  }, [activeSubscription]);

  const activePlanName = activePlanItem?.label ?? (activeSubscription?.plan ? planLabel(activeSubscription.plan) : "Premium Aktif");
  const activePlanDuration = activePlanItem?.duration ?? (activeSubscription?.plan ? planDurationFor(activeSubscription.plan) : "Aktif saat ini");
  const activeUntil = user?.subscription_end ?? activeSubscription?.expired_at ?? null;

  const formatDateLabel = (value: string | null): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

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
          accessibilityLabel="Kembali"
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

        <Text style={styles.heroLabel}>{isViewMode ? "Plan Premium Aktif" : "Upgrade ke Premium"}</Text>
        <Text style={styles.price}>{isViewMode ? activePlanName : selectedPlan.price}</Text>
        <Text style={styles.subTitle}>
          {isViewMode
            ? `${activePlanDuration}${formatDateLabel(activeUntil) ? ` · Berlaku sampai ${formatDateLabel(activeUntil)}` : ""}`
            : `Aktif untuk ${selectedPlan.duration}`}
        </Text>

        {isViewMode ? (
          <View style={styles.activePlanCard}>
            <View style={styles.activePlanHeader}>
              <View style={styles.activePlanBadge}>
                <Text style={styles.activePlanBadgeText}>{loadingActiveSubscription ? "Memuat" : "Aktif"}</Text>
              </View>
              <Text style={styles.activePlanTitle}>{activePlanName}</Text>
            </View>
            <View style={styles.activePlanMetaRow}>
              <Text style={styles.activePlanMetaLabel}>Plan aktif</Text>
              <Text style={styles.activePlanMetaValue}>{activePlanDuration}</Text>
            </View>
            {formatDateLabel(activeUntil) ? (
              <View style={styles.activePlanMetaRow}>
                <Text style={styles.activePlanMetaLabel}>Berlaku sampai</Text>
                <Text style={styles.activePlanMetaValue}>{formatDateLabel(activeUntil)}</Text>
              </View>
            ) : null}
            <Text style={styles.activePlanDescription}>
              {formatDateLabel(activeUntil)
                ? `Langganan ini aktif sampai ${formatDateLabel(activeUntil)}.`
                : "Langganan premium kamu sedang aktif di akun ini."}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>{isViewMode ? "FITUR YANG KAMU AKSES:" : "YANG KAMU DAPAT:"}</Text>

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
          <Text style={styles.socialProofText}>Bergabung dengan 500+ mahasiswa UC</Text>
        </View>

        {isViewMode ? null : (
          <View style={[styles.paymentCard, { marginBottom: 16 }]}>
            <Text style={styles.paymentLabel}>Pilih Paket</Text>
            <View style={styles.paymentMethods}>
              {plans.map((plan) => {
                const isSelected = selectedPlan.label === plan.label;

                return (
                  <Pressable
                    key={plan.label}
                    style={isSelected ? styles.paymentMethodActive : styles.paymentMethod}
                    onPress={() => setSelectedPlan(plan)}
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
          <Text style={styles.ctaText}>{isViewMode ? "Kembali ke Profil" : "Mulai Premium Sekarang"}</Text>
        </Pressable>
        <Text style={styles.footerNote}>{isViewMode ? "Plan aktif kamu sedang ditampilkan" : "Batalkan kapan saja"}</Text>
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