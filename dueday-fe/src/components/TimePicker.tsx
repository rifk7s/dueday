import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TimePickerProps = {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
};

export default function TimePicker({
  visible,
  onClose,
  onTimeSelect,
  selectedTime,
}: Readonly<TimePickerProps>) {
  const { t } = useTranslation();
  const [hour, setHour] = useState(selectedTime ? parseInt(selectedTime.split(":")[0]) : 0);
  const [minute, setMinute] = useState(selectedTime ? parseInt(selectedTime.split(":")[1]) : 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onTimeSelect(timeStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </Pressable>
              <Text style={styles.headerTitle}>{t("components.timePicker.title")}</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                {hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>{t("components.timePicker.hour")}</Text>
                <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                  {hours.map((h) => (
                    <Pressable
                      key={h}
                      style={[styles.pickerItem, h === hour && styles.pickerItemActive]}
                      onPress={() => setHour(h)}
                    >
                      <Text style={[styles.pickerItemText, h === hour && styles.pickerItemTextActive]}>
                        {h.toString().padStart(2, "00")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.divider}>
                <Text style={styles.dividerText}>:</Text>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>{t("components.timePicker.minute")}</Text>
                <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => (
                    <Pressable
                      key={m}
                      style={[styles.pickerItem, m === minute && styles.pickerItemActive]}
                      onPress={() => setMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, m === minute && styles.pickerItemTextActive]}>
                        {m.toString().padStart(2, "00")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>{t("common.ok")}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  content: { width: "100%", maxWidth: 400, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, paddingBottom: 16, maxHeight: "90%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow },
  headerTitle: { fontSize: 16, fontFamily: fonts["600"], color: colors.onSurface },
  timeDisplay: { paddingVertical: 16, alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow },
  timeText: { fontSize: 40, fontFamily: fonts["700"], color: colors.primaryContainer },
  pickerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 12, height: 250 },
  pickerSection: { flex: 1, alignItems: "center", height: "100%" },
  pickerLabel: { fontSize: 12, fontFamily: fonts["600"], color: colors.onSurfaceVariant, marginBottom: 4 },
  scrollPicker: { flex: 1, height: 200 },
  pickerItem: { height: 40, justifyContent: "center", alignItems: "center" },
  pickerItemActive: { backgroundColor: colors.surfaceContainerLow, borderRadius: 8 },
  pickerItemText: { fontSize: 16, fontFamily: fonts["500"], color: colors.onSurfaceVariant },
  pickerItemTextActive: { color: colors.primaryContainer, fontFamily: fonts["700"] },
  divider: { marginHorizontal: 8, justifyContent: "center", alignItems: "center", height: 250 },
  dividerText: { fontSize: 28, fontFamily: fonts["700"], color: colors.onSurface },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.surfaceContainerLow, paddingTop: 12 },
  cancelButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceContainerLow, alignItems: "center" },
  cancelText: { fontSize: 13, fontFamily: fonts["600"], color: colors.onSurface },
  confirmButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primaryContainer, alignItems: "center" },
  confirmText: { fontSize: 13, fontFamily: fonts["600"], color: colors.onPrimary },
});
