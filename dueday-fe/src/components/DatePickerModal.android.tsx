import { colors, fonts } from "@/constants/theme";
import { DateTimePicker } from "@expo/ui/jetpack-compose";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
};

const parseDDMMYYYY = (s?: string): Date => {
  if (!s) return new Date();
  const [d, m, y] = s.split("/").map(Number);
  if (!d || !m || !y) return new Date();
  return new Date(y, m - 1, d);
};

const formatDDMMYYYY = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

export default function DatePickerModal({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
}: Readonly<Props>) {
  const [draft, setDraft] = useState<Date>(() => parseDDMMYYYY(selectedDate));

  useEffect(() => {
    if (visible) setDraft(parseDDMMYYYY(selectedDate));
  }, [visible, selectedDate]);

  const handleConfirm = () => {
    onDateSelect(formatDDMMYYYY(draft));
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
            <Text style={styles.headerTitle}>Pilih Tanggal</Text>
            <View style={{ width: 24 }} />
          </View>

          <DateTimePicker
            style={styles.picker}
            variant="picker"
            showVariantToggle={false}
            displayedComponents="date"
            initialDate={draft.toISOString()}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  headerTitle: { fontSize: 18, fontFamily: fonts["600"], color: colors.onSurface },
  picker: { width: "100%", minHeight: 420, marginHorizontal: 8 },
  footer: { flexShrink: 0, flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontFamily: fonts["600"], color: colors.onSurface },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
  },
  confirmText: { fontSize: 14, fontFamily: fonts["600"], color: colors.onPrimary },
});
