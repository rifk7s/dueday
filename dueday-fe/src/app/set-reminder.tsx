import { toApiTime } from "@/api/format";
import TimePicker from "@/components/TimePicker";
import { colors, fonts, typography } from "@/constants/theme";
import { useUpdateActivityMutation } from "@/hooks/useActivities";
import { useUpdateTaskMutation } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReminderRouteType = "task" | "activity";

function resolveInitialTime(value: string | string[] | undefined): string {
  const timeText = Array.isArray(value) ? value[0] : value;
  if (typeof timeText === "string" && /^\d{2}:\d{2}$/.test(timeText)) {
    return timeText;
  }

  return "07:00";
}

function resolveReminderType(value: string | string[] | undefined): ReminderRouteType {
  const typeText = Array.isArray(value) ? value[0] : value;
  return typeText === "activity" ? "activity" : "task";
}

export default function SetReminderScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const reminderType = resolveReminderType(params.type);
  const reminderLabel = (Array.isArray(params.label) ? params.label[0] : params.label) ?? reminderType;
  const reminderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialMessage = Array.isArray(params.message) ? params.message[0] : params.message;
  const [message, setMessage] = React.useState(initialMessage ?? "");
  const [time, setTime] = React.useState(resolveInitialTime(params.time));
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const updateTaskMutation = useUpdateTaskMutation();
  const updateActivityMutation = useUpdateActivityMutation();
  const isSaving = updateTaskMutation.isPending || updateActivityMutation.isPending;
  const qc = useQueryClient();

  const handleSave = async () => {
    if (!reminderId) {
      const feedbackText = "Data reminder tidak ditemukan.";

      if (Platform.OS === "android") {
        ToastAndroid.show(feedbackText, ToastAndroid.SHORT);
      } else {
        Alert.alert("Gagal", feedbackText);
      }

      return;
    }

    try {
      if (reminderType === "task") {
        await updateTaskMutation.mutateAsync({ id: reminderId, data: { time: toApiTime(time), reminder_message: message.trim() || null } });
        qc.invalidateQueries({ queryKey: ["tasks"] });
      } else {
        await updateActivityMutation.mutateAsync({ id: reminderId, data: { time_start: toApiTime(time), reminder_message: message.trim() || null } });
        qc.invalidateQueries({ queryKey: ["activities"] });
      }

      const feedbackText = message.trim()
        ? `Reminder ${reminderLabel} disimpan dengan pesan.`
        : `Jam reminder ${reminderLabel} berhasil diubah.`;

      if (Platform.OS === "android") {
        ToastAndroid.show(feedbackText, ToastAndroid.SHORT);
      } else {
        Alert.alert("Berhasil", feedbackText);
      }

      router.back();
    } catch (error) {
      const feedbackText = error instanceof Error ? error.message : "Gagal menyimpan reminder.";

      if (Platform.OS === "android") {
        ToastAndroid.show(feedbackText, ToastAndroid.SHORT);
      } else {
        Alert.alert("Gagal", feedbackText);
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </Pressable>

        <Text style={styles.headerTitle}>Set Reminder</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.primaryContainer}
            />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroSubtitle}>
              Pengingat ini berjalan otomatis dan akan aktif di hari-hari tertentu sesuai prioritas dan deadline {reminderType === "activity" ? "aktivitas" : "tugas"} kamu.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Reminder untuk</Text>
              <Text style={styles.summaryTitle}>{reminderLabel}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Ionicons
                name={reminderType === "activity" ? "sparkles-outline" : "document-text-outline"}
                size={12}
                color={colors.primaryContainer}
              />
              <Text style={styles.typeBadgeText}>{reminderType === "activity" ? "Aktivitas" : "Tugas"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Isi Pesan</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={`Contoh: Kerjakan ${reminderLabel}`}
            placeholderTextColor={colors.iconMuted}
            style={styles.messageInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Waktu</Text>
          <Pressable style={styles.timeBox} onPress={() => setPickerVisible(true)}>
            <View style={styles.timeIconWrap}>
              <Ionicons name="time-outline" size={22} color={colors.primaryContainer} />
            </View>
            <View style={styles.timeTextBlock}>
              <Text style={styles.timeText}>{time}</Text>
              <Text style={styles.timeHint}>Ketuk untuk ubah waktu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
          </Pressable>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} />
          <Text style={styles.saveButtonText}>{isSaving ? "Menyimpan..." : "Simpan"}</Text>
        </Pressable>
      </ScrollView>

      <TimePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onTimeSelect={setTime}
        selectedTime={time}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  scrollView: {
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  heroTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontFamily: fonts["700"],
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: typography.bodySm.fontFamily,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryTextBlock: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontFamily: fonts["500"],
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fonts["700"],
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
  },
  typeBadgeText: {
    color: colors.primaryContainer,
    fontSize: 12,
    fontFamily: fonts["700"],
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
    gap: 10,
  },
  label: {
    color: colors.primaryContainer,
    fontSize: 12,
    fontFamily: fonts["700"],
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 108,
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontFamily: typography.bodyLg.fontFamily,
    backgroundColor: colors.surface,
    lineHeight: 22,
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
  },
  timeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  timeTextBlock: {
    flex: 1,
    gap: 2,
  },
  timeText: {
    color: colors.onSurface,
    fontSize: 34,
    fontFamily: fonts["700"],
  },
  timeHint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.bodySm.fontFamily,
  },
  saveButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: colors.primaryContainer,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontFamily: fonts["700"],
  },
});
