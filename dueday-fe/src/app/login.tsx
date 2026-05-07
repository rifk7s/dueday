import { colors, rounded, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.47;
const API_BASE_URL = "http://localhost:8000/api";

const UC_LOGO = require("@/assets/images/logo-uc.png");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message ?? "Login failed. Please try again.");
        return;
      }

      router.replace("/");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Orange gradient header */}
      <LinearGradient
        colors={[colors.primaryContainer, colors.secondaryContainer]}
        style={[
          styles.header,
          { height: HEADER_HEIGHT, paddingTop: insets.top + spacing.md },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image source={UC_LOGO} style={styles.logo} />
        </View>
        <Text style={styles.appName}>Dueday</Text>
        <Text style={styles.tagline}>Reminder Tugas Kampusmu</Text>
      </LinearGradient>

      {/* White form section */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },

  /* Header */
  header: {
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
    width: 80,
    height: 80,
    borderRadius: rounded.full,
  },
  appName: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.onPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.bodySm.fontSize,
    color: colors.onPrimary,
    opacity: 0.9,
  },

  /* Scroll / form */
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  scrollContent: {
    paddingHorizontal: spacing.containerPadding,
    paddingTop: spacing.xl,
  },
  heading: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.onSurface,
    letterSpacing: -0.64,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.bodyLg.fontSize,
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
    fontWeight: "700",
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
    fontWeight: typography.button.fontWeight,
    color: colors.onPrimary,
  },
  forgotBtn: {
    alignItems: "center",
  },
  forgotText: {
    fontSize: typography.bodyLg.fontSize,
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
    fontWeight: "600",
  },
});
