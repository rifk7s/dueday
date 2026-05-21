import type { ReminderSound, ReminderStyle } from "@/api/reminders";
import TimePicker from "@/components/TimePicker";
import { colors, fonts, typography } from "@/constants/theme";
import { useReminderSettingsQuery, useUpdateReminderSettingsMutation } from "@/hooks/useReminders";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, ToastAndroid, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReminderRouteType = "task" | "activity";

const STYLE_OPTIONS: { label: string; value: ReminderStyle }[] = [
  { label: "Tegas", value: "tegas" },
  { label: "Ngancam halus", value: "ngancam_halus" },
  { label: "Santai", value: "santai" },
];

const SOUND_OPTIONS: { label: string; value: ReminderSound }[] = [
  { label: "Default", value: "default" },
  { label: "Chime", value: "chime" },
  { label: "Bell", value: "bell" },
];

function resolveReminderType(value: string | string[] | undefined): ReminderRouteType {
  const t = Array.isArray(value) ? value[0] : value;
  return t === "activity" ? "activity" : "task";
}

function showFeedback(title: string, text: string): void {
  if (Platform.OS === "android") {
    ToastAndroid.show(text, ToastAndroid.SHORT);
  } else {
    Alert.alert(title, text);
  }
}

export default function SetReminderPremiumScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const reminderType = resolveReminderType(params.type);
  const reminderLabel = reminderType === "activity" ? "aktivitas" : "tugas";

  const settingsQuery = useReminderSettingsQuery();
  const mutation = useUpdateReminderSettingsMutation();
  const existing = settingsQuery.data?.[reminderType];

  const [message, setMessage] = React.useState("");
  const [time, setTime] = React.useState("07:00");
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [style, setStyle] = React.useState<ReminderStyle>("tegas");
  const [sound, setSound] = React.useState<ReminderSound>("default");
  const [vibrate, setVibrate] = React.useState(true);
  const [openDropdown, setOpenDropdown] = React.useState<null | "style" | "sound">(null);
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    if (existing.message) setMessage(existing.message);
    if (existing.time) setTime(existing.time);
    if (existing.style) setStyle(existing.style);
    if (existing.sound) setSound(existing.sound);
    setVibrate(existing.vibrate);
  }, [existing]);

  const isSaving = mutation.isPending;

  const handleSave = async () => {
    try {
      const result = await mutation.mutateAsync({
        [reminderType]: {
          time,
          message: message.trim() || null,
          style,
          sound,
          vibrate,
        },
      });
      if (!result.permissionGranted) {
        showFeedback("Izin notifikasi", "Pengaturan disimpan tapi izin notifikasi belum diberikan.");
      } else if (result.scheduledCount > 0) {
        showFeedback("Berhasil", `${result.scheduledCount} reminder ${reminderLabel} dijadwalkan.`);
      } else {
        showFeedback("Tersimpan", `Pengaturan reminder ${reminderLabel} tersimpan.`);
      }
      router.back();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan reminder.";
      showFeedback("Gagal", text);
    }
  };

  const selectedStyleLabel = STYLE_OPTIONS.find((o) => o.value === style)?.label ?? "Tegas";
  const selectedSoundLabel = SOUND_OPTIONS.find((o) => o.value === sound)?.label ?? "Default";

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

        <Text style={styles.headerTitle}>Set Reminder Premium</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name={reminderType === "activity" ? "sparkles-outline" : "document-text-outline"}
              size={20}
              color={colors.primaryContainer}
            />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Fitur Premium</Text>
            <Text style={styles.heroSubtitle}>
              Pengingat AI dengan gaya pilihan kamu. Berlaku untuk semua {reminderLabel} aktif.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Reminder untuk semua</Text>
              <Text style={styles.summaryTitle}>{reminderType === "activity" ? "Aktivitas" : "Tugas"}</Text>
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
          <Text style={styles.label}>Isi Pesan (opsional)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={`Kosongkan untuk pakai AI · contoh: Kerjakan ${reminderLabel}`}
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

        <View style={styles.card}>
          <Text style={styles.label}>Gaya Pesan</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setOpenDropdown(openDropdown === "style" ? null : "style")}
          >
            <Text style={styles.dropdownText}>{selectedStyleLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.iconMuted} />
          </Pressable>
          {openDropdown === "style" ? (
            <View style={styles.dropdownList}>
              {STYLE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setStyle(opt.value);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Suara Notifikasi</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setOpenDropdown(openDropdown === "sound" ? null : "sound")}
          >
            <Text style={styles.dropdownText}>{selectedSoundLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.iconMuted} />
          </Pressable>
          {openDropdown === "sound" ? (
            <View style={styles.dropdownList}>
              {SOUND_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSound(opt.value);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Getaran</Text>
          <Switch value={vibrate} onValueChange={setVibrate} thumbColor={colors.primaryContainer} />
        </View>

        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
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

      <Modal visible={isSaving} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
            <Text style={styles.loadingText}>Menjadwalkan reminder...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
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
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: typography.h2.fontSize, fontFamily: typography.h2.fontFamily, color: colors.onSurface },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
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
  heroIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceWarm },
  heroTextBlock: { flex: 1, gap: 4 },
  heroTitle: { color: colors.onSurface, fontSize: 16, fontFamily: fonts["700"] },
  heroSubtitle: { color: colors.onSurfaceVariant, fontSize: typography.bodySm.fontSize, lineHeight: 20, fontFamily: typography.bodySm.fontFamily },
  summaryCard: { borderRadius: 18, padding: 16, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.surfaceContainerHigh },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryTextBlock: { flex: 1, gap: 4 },
  summaryLabel: { color: colors.onSurfaceVariant, fontSize: 11, fontFamily: fonts["500"], textTransform: "uppercase", letterSpacing: 0.8 },
  summaryTitle: { color: colors.onSurface, fontSize: 18, fontFamily: fonts["700"] },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceWarm },
  typeBadgeText: { color: colors.primaryContainer, fontSize: 12, fontFamily: fonts["700"] },
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
  label: { color: colors.primaryContainer, fontSize: 12, fontFamily: fonts["700"], textTransform: "uppercase", letterSpacing: 0.8 },
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
  timeIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceWarm },
  timeTextBlock: { flex: 1, gap: 2 },
  timeText: { color: colors.onSurface, fontSize: 34, fontFamily: fonts["700"] },
  timeHint: { color: colors.onSurfaceVariant, fontSize: typography.bodySm.fontSize, fontFamily: typography.bodySm.fontFamily },
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
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.onPrimary, fontSize: 14, fontFamily: fonts["700"] },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  dropdownText: { color: colors.onSurface, fontFamily: fonts["500"] },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 12 },
  dropdownItemText: { color: colors.onSurface },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 14,
    minWidth: 220,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  loadingText: {
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["600"],
    textAlign: "center",
  },
});
