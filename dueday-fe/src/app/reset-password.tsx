import { resetPasswordRequest } from "@/auth/api";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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

const REDIRECT_SECONDS = 5;

type ResetParams = {
  email?: string;
  token?: string;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function ResetPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams<ResetParams>();
  const [email, setEmail] = useState(firstParam(params.email));
  const token = firstParam(params.token);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  // After a successful reset, count down and send the user back to login.
  // The "Masuk ke Login" button stays tappable so they can skip the wait.
  useEffect(() => {
    if (!success) return;
    if (secondsLeft <= 0) {
      router.replace("/login");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, secondsLeft, router]);

  const handleSubmit = async (): Promise<void> => {
    if (!email.trim() || !token.trim() || !password.trim() || !passwordConfirmation.trim()) {
      setError("Email, token, dan password baru harus lengkap.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPasswordRequest({
        email: email.trim(),
        token: token.trim(),
        password,
        passwordConfirmation,
      });
      setMessage("Password berhasil direset.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password.");
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
            <Ionicons name="key-outline" size={24} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Cek emailmu, lalu atur password baru kamu.</Text>
        </View>

        {error ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
            {success ? (
              <Text style={styles.successHint}>
                Kembali ke login dalam {secondsLeft} detik…
              </Text>
            ) : null}
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

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password Baru</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.tertiaryContainer} />
              <TextInput
                style={styles.textInput}
                placeholder="Password baru"
                placeholderTextColor={colors.tertiaryContainer}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.tertiaryContainer} />
              <TextInput
                style={styles.textInput}
                placeholder="Ulangi password baru"
                placeholderTextColor={colors.tertiaryContainer}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && !loading && styles.primaryButtonPressed, success && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || success}
          >
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>Reset Password</Text>}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.replace("/login")}>
            <Text style={styles.secondaryButtonText}>
              {success ? `Masuk ke Login (${secondsLeft})` : "Kembali ke Login"}
            </Text>
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
  successHint: {
    color: colors.onSurface,
    fontSize: 12,
    fontFamily: fonts["500"],
    marginTop: 4,
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
  primaryButtonDisabled: {
    opacity: 0.5,
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