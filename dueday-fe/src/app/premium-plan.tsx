import { goBackOr } from "@/constants/navigation";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  label: string;
  duration: string;
  price: string;
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
    label: "Paket 1 Bulan",
    duration: "1 bulan",
    price: "Rp20.000",
    note: "Cocok untuk coba premium dulu.",
  },
  {
    label: "Paket 3 Bulan",
    duration: "3 bulan",
    price: "Rp54.000",
    note: "Hemat 10% dibanding bayar bulanan.",
  },
  {
    label: "Paket 1 Tahun",
    duration: "12 bulan",
    price: "Rp192.000",
    note: "Pilihan paling hemat untuk pemakaian penuh.",
  },
];

export default function PremiumPlanScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem>(plans[0]);

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

        <Text style={styles.heroLabel}>Upgrade ke Premium</Text>
        <Text style={styles.price}>{selectedPlan.price}</Text>
        <Text style={styles.subTitle}>Aktif untuk {selectedPlan.duration}</Text>

        <Text style={styles.sectionLabel}>YANG KAMU DAPAT:</Text>

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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/payment",
              params: {
                planName: selectedPlan.label,
                planPrice: selectedPlan.price,
                planDuration: selectedPlan.duration,
              },
            })
          }
        >
          <Text style={styles.ctaText}>Mulai Premium Sekarang</Text>
        </Pressable>
        <Text style={styles.footerNote}>Batalkan kapan saja</Text>
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