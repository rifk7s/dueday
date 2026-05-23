import { colors, fonts } from "@/constants/theme";
import { DateTimePicker } from "@expo/ui/jetpack-compose";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
};

const parseHHMM = (s?: string): Date => {
  const d = new Date();
  if (s) {
    const [h, m] = s.split(":").map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
};

const formatHHMM = (d: Date): string =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export default function TimePickerModal({
  visible,
  onClose,
  onTimeSelect,
  selectedTime,
}: Readonly<Props>) {
  const [initialIso, setInitialIso] = useState<string>(() => parseHHMM(selectedTime).toISOString());
  const [draft, setDraft] = useState<Date>(() => parseHHMM(selectedTime));

  useEffect(() => {
    if (visible) {
      const d = parseHHMM(selectedTime);
      setInitialIso(d.toISOString());
      setDraft(d);
    }
  }, [visible, selectedTime]);

  const handleConfirm = () => {
    onTimeSelect(formatHHMM(draft));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.headerTitle}>Pilih Waktu</Text>
            <View style={{ width: 24 }} />
          </View>

          <DateTimePicker
            style={styles.picker}
            variant="picker"
            showVariantToggle={false}
            displayedComponents="hourAndMinute"
            is24Hour
            initialDate={initialIso}
            onDateSelected={setDraft}
            color={colors.primaryContainer}
          />

          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  headerTitle: { fontSize: 16, fontFamily: fonts["600"], color: colors.onSurface },
  picker: { width: "100%", height: 400 },
  footer: {
    flexShrink: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerLow,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontFamily: fonts["600"], color: colors.onSurface },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
  },
  confirmText: { fontSize: 13, fontFamily: fonts["600"], color: colors.onPrimary },
});
