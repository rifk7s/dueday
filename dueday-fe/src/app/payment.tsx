import { goBackOr } from "@/constants/navigation";
import { useSession } from "@/auth/ctx";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createPaymentFlow,
  parseRupiahAmount,
  type PaymentMethod,
} from "@/api/payments";

type PaymentMethodItem = {
  id: string;
  name: string;
  image: number;
};

const paymentMethods: PaymentMethodItem[] = [
  { id: "bca", name: "BCA", image: require("../../assets/images/BCA.jpg") },
  { id: "mandiri", name: "Mandiri", image: require("../../assets/images/mandiri.jpg") },
  { id: "gopay", name: "GoPay", image: require("../../assets/images/gopay.jpg") },
  { id: "dana", name: "Dana", image: require("../../assets/images/dana.jpg") },
  { id: "ovo", name: "OVO", image: require("../../assets/images/ovo.jpg") },
];

export default function PaymentScreen(): React.JSX.Element {
  const router = useRouter();
  const { token } = useSession();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const planName = (params.planName as string) || "Dueday Premium - 1 Bulan";
  const planPrice = (params.planPrice as string) || "Rp20.000";
  const planAmount = Number(params.planAmount ?? "0") || 0;
  const planDuration = (params.planDuration as string) || "1 bulan";

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedMethodData = paymentMethods.find((item) => item.id === selectedMethod);

  const handleProceed = async () => {
    if (!selectedMethodData || isSubmitting) {
      return;
    }

    setErrorMessage(null);

    // If the app is in mock-auth mode, keep the local manual flow intact.
    if (!token || process.env.EXPO_PUBLIC_MOCK_AUTH === "true") {
      router.push({
        pathname: "/detail-transfer",
        params: {
          methodId: selectedMethodData.id,
          methodName: selectedMethodData.name,
          planName,
          planPrice,
          planAmount: String(planAmount || parseRupiahAmount(planPrice)),
          planDuration,
        },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payment = await createPaymentFlow(token, {
        planName,
        planPrice,
        planDuration,
        amount: planAmount || parseRupiahAmount(planPrice),
        method: selectedMethodData as PaymentMethod,
      });

      router.replace({
        pathname: "/detail-transfer",
        params: {
          paymentId: payment.id,
          paymentStatus: payment.status,
          methodId: selectedMethodData.id,
          methodName: selectedMethodData.name,
          planName,
          planPrice,
          planAmount: String(planAmount || parseRupiahAmount(planPrice)),
          planDuration,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyiapkan pembayaran. Coba lagi nanti.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={10}
          onPress={() => goBackOr("/premium-plan")}
        >
          <Ionicons name="arrow-back" size={28} color={colors.primaryContainer} />
        </Pressable>

        <Text style={styles.headerTitle}>Pembayaran</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>{planName}</Text>
            <Text style={styles.summaryDuration}>Langganan Individual</Text>
          </View>
          <Text style={styles.summaryPrice}>{planPrice}</Text>
        </View>

        <Text style={styles.methodLabel}>Pilih Metode Pembayaran</Text>

        <View style={styles.methodList}>
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;

            return (
              <Pressable
                key={method.id}
                style={[
                  styles.methodCard,
                  isSelected && styles.methodCardActive,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodAccent} />
                <View style={styles.methodContent}>
                  <View style={styles.methodLogoWrap}>
                    <Image
                      source={method.image}
                      style={styles.methodLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.methodName,
                      isSelected && styles.methodNameActive,
                    ]}
                  >
                    {method.name}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isSelected ? colors.primaryContainer : colors.iconMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            (!selectedMethod || isSubmitting) && styles.ctaButtonDisabled,
            pressed && selectedMethod && !isSubmitting && styles.ctaButtonPressed,
          ]}
          accessibilityRole="button"
          onPress={handleProceed}
          disabled={!selectedMethod || isSubmitting}
        >
          <Text style={styles.ctaText}>
            {isSubmitting ? "Menyiapkan Pembayaran..." : "Lanjutkan Pembayaran"}
          </Text>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
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
    paddingTop: 20,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  summaryDuration: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  summaryPrice: {
    fontSize: 18,
    fontFamily: fonts["700"],
    color: colors.primaryContainer,
  },
  totalCard: {
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: fonts["800"],
    color: colors.primaryContainer,
  },
  methodLabel: {
    fontSize: 14,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  methodList: {
    gap: 10,
  },
  methodCard: {
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 12,
    overflow: "hidden",
  },
  methodAccent: {
    width: 4,
    backgroundColor: colors.primaryContainer,
  },
  methodCardActive: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.surfaceWarm,
  },
  methodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingHorizontal: 14,
  },
  methodLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLogo: {
    width: 32,
    height: 32,
  },
  methodName: {
    fontSize: 15,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  methodNameActive: {
    color: colors.primaryContainer,
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
  ctaButtonDisabled: {
    opacity: 0.48,
    shadowOpacity: 0,
    elevation: 0,
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
  errorText: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.error,
    textAlign: "center",
  },
});
