import { useSession } from "@/auth/ctx";
import { colors, fonts, rounded, spacing, typography } from "@/constants/theme";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT_OPEN = SCREEN_HEIGHT * 0.47;
const HEADER_HEIGHT_CLOSED = SCREEN_HEIGHT * 0.22;
const LOGO_SIZE_OPEN = 80;
const LOGO_SIZE_CLOSED = 56;

const UC_LOGO = require("@/assets/images/logo-uc.png");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const { height: kbHeight } = useGradualAnimation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      kbHeight.value,
      [0, 200],
      [HEADER_HEIGHT_OPEN, HEADER_HEIGHT_CLOSED],
      Extrapolation.CLAMP,
    ),
  }));

  const logoStyle = useAnimatedStyle(() => {
    const size = interpolate(
      kbHeight.value,
      [0, 200],
      [LOGO_SIZE_OPEN, LOGO_SIZE_CLOSED],
      Extrapolation.CLAMP,
    );
    return { width: size, height: size };
  });

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      kbHeight.value,
      [0, 80],
      [0.9, 0],
      Extrapolation.CLAMP,
    ),
    height: interpolate(
      kbHeight.value,
      [0, 80],
      [typography.bodySm.fontSize * 1.4, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const topSpacerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      kbHeight.value,
      [0, 200],
      [spacing.xl, spacing.sm],
      Extrapolation.CLAMP,
    ),
  }));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(username.trim(), password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Orange gradient header (animated, shrinks when keyboard opens) */}
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        <LinearGradient
          colors={[colors.primaryContainer, colors.secondaryContainer]}
          style={[
            StyleSheet.absoluteFillObject,
            styles.headerContent,
            { paddingTop: insets.top + spacing.md },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Animated.Image
              source={UC_LOGO}
              style={[styles.logo, logoStyle]}
            />
          </View>
          <Text style={styles.appName}>Dueday</Text>
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Reminder Tugas Kampusmu
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      {/* White form section — KeyboardAwareScrollView ensures focused field stays visible */}
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spacing.lg}
      >
        <Animated.View style={topSpacerStyle} />
        <Text style={styles.heading}>Masuk</Text>
        <Text style={styles.subheading}>
          Selamat datang! Masukkan detail akunmu.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Username field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username UC</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.tertiaryContainer}
                style={styles.leadIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor={colors.tertiaryContainer}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kata Sandi</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.tertiaryContainer}
                style={styles.leadIcon}
              />
              <TextInput
                style={[styles.textInput, styles.textInputWithTrail]}
                placeholder="Kata sandi"
                placeholderTextColor={colors.tertiaryContainer}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword((p) => !p)}
                style={styles.trailButton}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.tertiaryContainer}
                />
              </Pressable>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cta}>
            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && !loading && styles.loginBtnPressed,
                loading && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.loginBtnText}>Masuk</Text>
              )}
            </Pressable>
            <Pressable style={styles.forgotBtn} disabled={loading}>
              <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },

  /* Header */
  headerWrapper: {
    overflow: "hidden",
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.containerPadding,
    paddingBottom: spacing.xl,
  },
  logoWrapper: {
    shadowColor: colors.onPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.md,
  },
  logo: {
    borderRadius: rounded.full,
  },
  appName: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["400"],
    color: colors.onPrimary,
    overflow: "hidden",
  },

  /* Scroll / form */
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  scrollContent: {
    paddingHorizontal: spacing.containerPadding,
  },
  heading: {
    fontSize: typography.h1.fontSize,
    fontFamily: typography.h1.fontFamily,
    color: colors.onSurface,
    letterSpacing: -0.64,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  leadIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["400"],
    color: colors.onSurface,
    height: "100%",
    padding: 0,
  },
  textInputWithTrail: {
    paddingRight: spacing.xs,
  },
  trailButton: {
    padding: spacing.xs,
  },

  /* CTA */
  cta: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  loginBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: rounded.full,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnPressed: {
    opacity: 0.85,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
    color: colors.onPrimary,
  },
  forgotBtn: {
    alignItems: "center",
  },
  forgotText: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["400"],
    color: colors.primaryContainer,
    textDecorationLine: "underline",
  },

  errorBox: {
    backgroundColor: colors.errorSoft,
    borderRadius: rounded.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.errorStrong,
    fontFamily: fonts["600"],
  },
});
