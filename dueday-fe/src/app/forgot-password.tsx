import { forgotPasswordRequest } from "@/auth/api";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (): Promise<void> => {
    if (!email.trim()) {
      setError("Masukkan email UC kamu.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await forgotPasswordRequest(email.trim());
      // No real email is sent — when the account exists the API returns the token
      // directly so we can jump straight to the pre-filled reset screen.
      if (response.token && response.email) {
        router.push({
          pathname: "/reset-password",
          params: { email: response.email, token: response.token },
        });
        return;
      }
      setMessage("Jika email kamu terdaftar, lanjutkan ke layar reset password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses permintaan reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + 24, paddingBottom: bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="mail-outline" size={24} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>Lupa Kata Sandi</Text>
          <Text style={styles.subtitle}>Masukkan email UC kamu, lalu kami kirim tautan reset password.</Text>
        </View>

        {error ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email UC</Text>
            <View style={styles.inputRow}>
              <Ionicons name="at-outline" size={20} color={colors.tertiaryContainer} />
              <TextInput
                style={styles.textInput}
                placeholder="nama@uc.ac.id"
                placeholderTextColor={colors.tertiaryContainer}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && !loading && styles.primaryButtonPressed]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>Kirim Link Reset</Text>}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.replace("/login")}> 
            <Text style={styles.secondaryButtonText}>Kembali ke Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
  },
  hero: {
    gap: 10,
    paddingVertical: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
    marginBottom: 4,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontFamily: typography.h1.fontFamily,
    color: colors.onSurface,
    letterSpacing: -0.64,
  },
  subtitle: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  alertBox: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surfaceContainerLow,
  },
  alertText: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: fonts["500"],
  },
  successBox: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surfaceSuccess,
  },
  successText: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: fonts["700"],
  },
  form: {
    gap: 14,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fonts["500"],
    paddingVertical: 0,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
  },
  secondaryButtonText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontFamily: fonts["700"],
  },
});