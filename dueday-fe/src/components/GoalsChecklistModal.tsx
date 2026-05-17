import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  goals: string[];
  initialChecked?: Record<number, boolean>;
  onClose: () => void;
  onSave: (checkedMap: Record<number, boolean>) => void;
};

export default function GoalsChecklistModal({ visible, goals, initialChecked = {}, onClose, onSave }: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>(initialChecked);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setChecked(initialChecked ?? {});
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible, initialChecked, anim]);

  const toggle = (i: number) => setChecked((p) => ({ ...p, [i]: !p[i] }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, { transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }], opacity: anim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Checklist Goals</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <ScrollView style={styles.list}>
          {goals.map((g, i) => {
            const isChecked = !!(checked[i]);
            return (
              <Pressable key={`${i}-${g}`} style={styles.row} onPress={() => toggle(i)}>
                <View style={[styles.box, isChecked && styles.boxChecked]}>
                  {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.rowText}>{g}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={styles.ghost} onPress={onClose}>
            <Text style={styles.ghostText}>Batal</Text>
          </Pressable>
          <Pressable style={styles.save} onPress={() => onSave(checked)}>
            <Text style={styles.saveText}>Simpan</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    shadowColor: colors.onSurface,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 16, fontFamily: fonts["700"], color: colors.onSurface },
  closeBtn: { padding: 6, borderRadius: 8 },
  list: { maxHeight: 300, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  box: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.inputBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceContainerLowest },
  boxChecked: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  checkMark: { color: colors.onPrimary, fontFamily: fonts["700"] },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts["500"], color: colors.onSurfaceVariant },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  ghost: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  ghostText: { color: colors.onSurfaceVariant, fontFamily: fonts["600"] },
  save: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primaryContainer },
  saveText: { color: colors.onPrimary, fontFamily: fonts["600"] },
});
