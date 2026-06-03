import type { ReminderSound, ReminderStyle } from "@/api/reminders";
import TimePicker from "@/components/TimePickerModal";
import { colors, fonts, typography } from "@/constants/theme";
import { useReminderSettingsQuery, useUpdateReminderSettingsMutation } from "@/hooks/useReminders";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReminderRouteType = "task" | "activity";

const STYLE_VALUES: ReminderStyle[] = ["tegas", "ngancam_halus", "santai"];

// Sound names are technical/brand labels shown identically in both languages.
const SOUND_OPTIONS: { label: string; value: ReminderSound }[] = [
  { label: "Default", value: "default" },
  { label: "Chime", value: "chime" },
  { label: "Bell", value: "bell" },
];

function styleLabel(value: ReminderStyle, t: TFunction): string {
  switch (value) {
    case "tegas":
      return t("setReminderPremium.styleFirm");
    case "ngancam_halus":
      return t("setReminderPremium.styleSubtle");
    case "santai":
      return t("setReminderPremium.styleCasual");
  }
}

function resolveReminderType(value: string | string[] | undefined): ReminderRouteType {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "activity" ? "activity" : "task";
}

function showFeedback(title: string, text: string): void {
  Alert.alert(title, text);
}

function formatFireTime(d: Date, t: TFunction, now: Date = new Date()): string {
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (sameDay) return t("setReminder.todayAt", { time: `${hh}:${mm}` });
  const day = d.getDate();
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${day} ${monthLabels[d.getMonth()]} ${hh}:${mm}`;
}

export default function SetReminderPremiumScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const reminderType = resolveReminderType(params.type);
  const reminderLabel = reminderType === "activity" ? t("setReminder.typeActivity") : t("setReminder.typeTask");

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
      const summary = result[reminderType];
      if (!result.permissionGranted) {
        showFeedback(t("setReminder.permTitle"), t("setReminder.permBody"));
      } else if (summary.scheduledCount === 0) {
        showFeedback(
          t("setReminder.noneTitle"),
          t("setReminder.noneBody", { label: reminderLabel }),
        );
      } else {
        const first = summary.firstFireAt ? formatFireTime(summary.firstFireAt, t) : null;
        const last = summary.lastFireAt ? formatFireTime(summary.lastFireAt, t) : null;
        const range = first && last && first !== last ? `${first} → ${last}` : first ?? "";
        showFeedback(
          t("common.success"),
          t("setReminder.successBody", { count: summary.scheduledCount, label: reminderLabel, range }),
        );
      }
      router.back();
    } catch (error) {
      const text = error instanceof Error ? error.message : t("setReminderPremium.saveFailed");
      showFeedback(t("common.failed"), text);
    }
  };

  const selectedStyleLabel = styleLabel(style, t);
  const selectedSoundLabel = SOUND_OPTIONS.find((o) => o.value === sound)?.label ?? "Default";

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("setReminderPremium.title")}</Text>

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
              name={reminderType === "activity" ? "sparkles-outline" : "document-text-outline"}
              size={20}
              color={colors.primaryContainer}
            />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>{t("setReminderPremium.heroTitle")}</Text>
            <Text style={styles.heroSubtitle}>
              {t("setReminderPremium.heroSubtitle", { label: reminderLabel })}
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>{t("setReminder.forAll")}</Text>
              <Text style={styles.summaryTitle}>{reminderType === "activity" ? t("common.activity") : t("common.task")}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Ionicons
                name={reminderType === "activity" ? "sparkles-outline" : "document-text-outline"}
                size={12}
                color={colors.primaryContainer}
              />
              <Text style={styles.typeBadgeText}>{reminderType === "activity" ? t("common.activity") : t("common.task")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("setReminderPremium.messageLabel")}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t("setReminderPremium.messagePlaceholder", { label: reminderLabel })}
            placeholderTextColor={colors.iconMuted}
            style={styles.messageInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("setReminderPremium.timeLabel")}</Text>
          <Pressable style={styles.timeBox} onPress={() => setPickerVisible(true)}>
            <View style={styles.timeIconWrap}>
              <Ionicons name="time-outline" size={22} color={colors.primaryContainer} />
            </View>
            <View style={styles.timeTextBlock}>
              <Text style={styles.timeText}>{time}</Text>
              <Text style={styles.timeHint}>{t("setReminderPremium.timeHint")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("setReminderPremium.styleLabel")}</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setOpenDropdown(openDropdown === "style" ? null : "style")}
          >
            <Text style={styles.dropdownText}>{selectedStyleLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.iconMuted} />
          </Pressable>
          {openDropdown === "style" ? (
            <View style={styles.dropdownList}>
              {STYLE_VALUES.map((value) => (
                <Pressable
                  key={value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setStyle(value);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{styleLabel(value, t)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("setReminderPremium.soundLabel")}</Text>
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
          <Text style={styles.label}>{t("setReminderPremium.vibrateLabel")}</Text>
          <Switch value={vibrate} onValueChange={setVibrate} thumbColor={colors.primaryContainer} />
        </View>

        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} />
          <Text style={styles.saveButtonText}>{isSaving ? t("common.saving") : t("common.save")}</Text>
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
            <Text style={styles.loadingText}>{t("setReminder.scheduling")}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  scrollView: { backgroundColor: colors.surface },
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
