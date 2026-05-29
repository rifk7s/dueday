import { exitFlowTo } from "@/constants/navigation";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    Animated,
    BackHandler,
    type DimensionValue,
    Easing,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AccentDotProps = {
  size: number;
  color: string;
  top: number;
  left?: DimensionValue;
  right?: DimensionValue;
  delay: number;
};

function AccentDot({ size, color, top, left, right, delay }: AccentDotProps): React.JSX.Element {
  const floatValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: 1,
          duration: 1200,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [delay, floatValue]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.accentDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          right,
          transform: [
            {
              translateY: floatValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
          ],
          opacity: floatValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.55, 0.95],
          }),
        },
      ]}
    />
  );
}

export default function PaymentRejectedScreen(): React.JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const planName = (params.planName as string) || "Dueday Premium - 1 Bulan";
  const methodName = (params.methodName as string) || "Virtual Account";
  // Carried over from detail-transfer so retry re-enters /payment with the
  // original plan selection rather than the screen's defaults.
  const mode = params.mode as string | undefined;
  const plan = params.plan as string | undefined;
  const planPrice = params.planPrice as string | undefined;
  const planAmount = params.planAmount as string | undefined;
  const planDuration = params.planDuration as string | undefined;

  const handleBack = useCallback(() => {
    exitFlowTo("/profile");
  }, []);

  const handleRetry = useCallback(() => {
    // Replace (not dismissTo): in the real flow /payment was replaced out of the
    // stack, so there's nothing to dismiss back to. Stays inside the modal host.
    router.replace({
      pathname: "/payment",
      params: {
        ...(mode ? { mode } : {}),
        ...(plan ? { plan } : {}),
        planName,
        ...(planPrice ? { planPrice } : {}),
        ...(planAmount ? { planAmount } : {}),
        ...(planDuration ? { planDuration } : {}),
      },
    });
  }, [router, mode, plan, planName, planPrice, planAmount, planDuration]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(16)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(heroScale, {
          toValue: 1.08,
          speed: 16,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          speed: 16,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslate, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [contentOpacity, contentTranslate, heroOpacity, heroScale]);

  const dots = useMemo<AccentDotProps[]>(
    () => [
      { size: 10, color: colors.errorContainer, top: 100, left: "14%", delay: 0 },
      { size: 14, color: colors.surfaceWarm, top: 132, right: "12%", delay: 180 },
      { size: 8, color: colors.errorStrong, top: 164, left: "22%", delay: 260 },
      { size: 12, color: colors.errorContainer, top: 188, right: "22%", delay: 420 },
    ],
    []
  );

  const reasons = useMemo(
    () => [
      {
        key: "method",
        title: "Metode pembayaran",
        desc: `Pembayaran melalui ${methodName} mungkin gagal. Periksa detail atau pilih metode lain.`,
        icon: "card-outline",
      },
      {
        key: "bank",
        title: "Dari pihak bank",
        desc: "Transfer ditolak oleh bank penerbit. Coba lagi nanti atau hubungi bank.",
        icon: "business-outline",
      },
    ],
    [methodName]
  );

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <StatusBar style="dark" />

      {dots.map((dot, index) => (
        <AccentDot
          key={`dot-${index}`}
          size={dot.size}
          color={dot.color}
          top={dot.top}
          left={dot.left}
          right={dot.right}
          delay={dot.delay}
        />
      ))}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.heroWrap,
              {
                opacity: heroOpacity,
                transform: [{ scale: heroScale }],
              },
            ]}
          >
            <View style={styles.heroOuterCircle}>
              <View style={styles.heroInnerCircle}>
                <Ionicons name="close-outline" size={44} color={colors.onError} />
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
              width: "100%",
            }}
          >
            <Text style={styles.title}>Pembayaran Ditolak</Text>
            <Text style={styles.subtitle}>Pembayaran gagal diproses. Silakan coba lagi atau pilih metode lain.</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paket</Text>
                <Text style={styles.summaryValue}>{planName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Metode</Text>
                <Text style={styles.summaryValue}>{methodName}</Text>
              </View>
            </View>

            <View style={styles.featuresWrap}>
              <Text style={styles.featuresTitle}>Kemungkinan penyebab</Text>
              {reasons.map((r) => (
                <View key={r.key} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={r.icon as any} size={18} color={colors.errorStrong} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>{r.title}</Text>
                    <Text style={styles.featureDesc}>{r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.footerActions, { paddingBottom: bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          accessibilityRole="button"
          onPress={handleRetry}
        >
          <Text style={styles.primaryButtonText}>Coba Lagi</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          accessibilityRole="button"
          onPress={handleBack}
        >
          <Text style={styles.secondaryButtonText}>Kembali ke Profil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroWrap: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  heroOuterCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.errorContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInnerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.errorStrong,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.errorStrong,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontFamily: fonts["800"],
    color: colors.onSurface,
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: typography.bodyLg.fontSize,
    fontFamily: typography.bodyLg.fontFamily,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  summaryCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 14,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  featuresWrap: {
    marginTop: 18,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  featuresTitle: {
    fontSize: 13,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  featureDesc: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  footerActions: {
    gap: 10,
    paddingTop: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.errorStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
    color: colors.onError,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
    color: colors.onSurface,
  },
  accentDot: {
    position: "absolute",
  },
});
