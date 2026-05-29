import { exitFlowTo } from "@/constants/navigation";
import { colors, fonts, typography } from "@/constants/theme";
import { ensureNotificationPermission } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
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

export default function PaymentSuccessScreen(): React.JSX.Element {
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const planName = (params.planName as string) || "Dueday Premium - 1 Bulan";
  const planPrice = (params.planPrice as string) || "Rp20.000";
  const methodName = (params.methodName as string) || "Virtual Account";

  const handleDone = useCallback(() => {
    // Single native dismiss that also switches the buried tab back to
    // profile, so the sheet slides down once and reveals the profile tab
    // the flow was launched from (not the dashboard).
    exitFlowTo("/profile");
  }, []);

  useEffect(() => {
    // Android hardware back must also exit the flow, not pop back into the
    // (already completed) detail-transfer screen.
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleDone();
      return true;
    });
    return () => sub.remove();
  }, [handleDone]);

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
      { size: 10, color: colors.secondaryContainer, top: 100, left: "14%", delay: 0 },
      { size: 14, color: colors.surfaceWarm, top: 132, right: "12%", delay: 180 },
      { size: 8, color: colors.primaryContainer, top: 164, left: "22%", delay: 260 },
      { size: 12, color: colors.secondaryContainer, top: 188, right: "22%", delay: 420 },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        key: "unlimited_import",
        title: "Import E-Learn Tanpa Batas",
        desc: "Impor tugas dari e-learn sepuasnya. Versi gratis dibatasi 3x impor per bulan.",
        icon: "infinite-outline",
      },
      {
        key: "reminders",
        title: "Reminder Personalization",
        desc: "Reminder otomatis yang menyesuaikan deadline, waktu kosong, dan kebiasaan kamu setiap hari.",
        icon: "notifications-outline",
      },
    ],
    []
  );

  useEffect(() => {
    let active = true;

    async function notify() {
      if (Platform.OS === "web") return; // skip on web

      try {
        const granted = await ensureNotificationPermission();
        if (!granted || !active) return;

        // Use scheduleNotificationAsync to present immediately (consistent typings)
        // scheduleNotificationAsync typings require a trigger; cast to any to present immediately
        await (Notifications as any).scheduleNotificationAsync({
          content: {
            title: "Pembayaran Berhasil",
            body: `${planName} sudah aktif. Ketuk untuk melihat fitur yang didapatkan.`,
            data: {
              type: "payment-success",
              planName,
              features: JSON.stringify(features),
            },
          },
        });
      } catch (e) {
        // log error so we can debug why presentNotificationAsync failed
        // eslint-disable-next-line no-console
        console.warn("presentNotificationAsync error:", e);
      }
    }

    notify();

    return () => {
      active = false;
    };
  }, [planName, features]);

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
              <Ionicons name="checkmark" size={44} color={colors.onPrimary} />
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
          <Text style={styles.title}>Pembayaran Berhasil</Text>
          <Text style={styles.subtitle}>Langganan premium kamu sudah aktif dan siap dipakai.</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Paket</Text>
              <Text style={styles.summaryValue}>{planName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Metode</Text>
              <Text style={styles.summaryValue}>{methodName}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryPrice}>{planPrice}</Text>
            </View>
          </View>

            <View style={styles.featuresWrap}>
              <Text style={styles.featuresTitle}>Fitur yang dibuka</Text>
              {features.map((f) => (
                <View key={f.key} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={f.icon as any} size={18} color={colors.primaryContainer} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
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
          onPress={handleDone}
        >
          <Text style={styles.primaryButtonText}>Kembali ke Profil</Text>
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
    backgroundColor: colors.surfaceSuccess,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInnerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.success,
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
  summaryRowLast: {
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
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
  summaryPrice: {
    fontSize: 17,
    fontFamily: fonts["800"],
    color: colors.primaryContainer,
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
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
    color: colors.onPrimary,
  },
  accentDot: {
    position: "absolute",
  },
});