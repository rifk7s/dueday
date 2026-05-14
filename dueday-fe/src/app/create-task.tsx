import DatePickerCalendar from "@/components/DatePickerCalendar";
import TimePicker from "@/components/TimePicker";
import { colors, fonts } from "@/constants/theme";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { useCreateTaskMutation } from "@/hooks/useTasks";
import { useTagIdByName } from "@/hooks/useTags";
import { toApiDate, toApiTime } from "@/api/format";
import { PRIORITY_API_MAP } from "@/api/tasks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView, useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PriorityType = "Tinggi" | "Sedang" | "Rendah" | null;
type TagType = "Kuliah" | "Pekerjaan" | "Rapat" | "Rumah";

export default function CreateTaskPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useGradualAnimation();
  const scrollRef = useRef<React.ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const prevGoalsHeight = useRef(0);
  const isGoalsFocused = useRef(false);
  const prevDescHeight = useRef(0);
  const isDescFocused = useRef(false);
  const [footerHeight, setFooterHeight] = useState(80);

  const [namatugas, setNamaTugas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [prioritas, setPrioritas] = useState<PriorityType>(null);
  const [tag, setTag] = useState<TagType | null>(null);
  const [goals, setGoals] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [validationError, setValidationError] = useState("");

  const tagOptions: TagType[] = ["Kuliah", "Pekerjaan", "Rapat", "Rumah"];

  const mutation = useCreateTaskMutation();
  const tagId = useTagIdByName(tag);
  const isKeyboardVisible = useKeyboardState((s) => s.isVisible);

  const getPriorityColor = (priority: PriorityType) => {
    if (priority === "Tinggi") return colors.error;
    if (priority === "Sedang") return colors.primaryContainer;
    if (priority === "Rendah") return colors.success;
    return colors.surfaceContainerLow;
  };

  const handleSave = () => {
    // Two-stage save: first tap dismisses keyboard so the user can see the full
    // form and verify required pickers (tenggat) before committing.
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    if (!namatugas.trim()) {
      setValidationError("Nama tugas wajib diisi.");
      return;
    }
    if (!tanggal) {
      setValidationError("Tenggat waktu wajib dipilih.");
      return;
    }
    setValidationError("");

    mutation.mutate(
      {
        task_name: namatugas.trim(),
        date: toApiDate(tanggal),
        ...(jam ? { time: toApiTime(jam) } : {}),
        ...(prioritas ? { priority: PRIORITY_API_MAP[prioritas] } : {}),
        ...(tagId !== undefined ? { id_tag: tagId } : {}),
        ...(goals.trim() ? { goals: goals.trim() } : {}),
        ...(deskripsi.trim() ? { deskripsi: deskripsi.trim() } : {}),
        status: "ongoing",
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    bottom: height.value,
    paddingBottom: interpolate(
      height.value,
      [0, 1],
      [bottom + 16, 16],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButtonIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Buat Tugas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* bottomOffset is measured from the footer at runtime so it adapts to screen size and style changes */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footerHeight + 16}
      >
        {validationError ? (
          <Text style={styles.errorText}>{validationError}</Text>
        ) : null}
        {mutation.isError ? (
          <Text style={styles.errorText}>
            {mutation.error instanceof Error ? mutation.error.message : "Gagal menyimpan tugas."}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Nama Tugas</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Laporan RPL Bab 3"
            placeholderTextColor={colors.iconMuted}
            value={namatugas}
            onChangeText={setNamaTugas}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tenggat Waktu</Text>
          <Pressable style={styles.dateTimeContainer} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !tanggal && styles.dateTimePlaceholder]}>
              {tanggal || "Pilih tanggal"}
            </Text>
          </Pressable>
          <Pressable style={styles.dateTimeContainer} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !jam && styles.dateTimePlaceholder]}>
              {jam || "Pilih waktu"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prioritas</Text>
          <View style={styles.chipRow}>
            {(["Tinggi", "Sedang", "Rendah"] as const).map((priority) => {
              const isSelected = prioritas === priority;
              const priorityColor = getPriorityColor(priority);
              return (
                <Pressable
                  key={priority}
                  onPress={() => setPrioritas(prioritas === priority ? null : priority)}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: priorityColor }
                      : { backgroundColor: "transparent", borderWidth: 2, borderColor: priorityColor },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? colors.onPrimary : priorityColor }]}>
                    {priority}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.chipRow}>
            {tagOptions.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTag(tag === t ? null : t)}
                style={[
                  styles.chip,
                  { backgroundColor: tag === t ? colors.primaryContainer : colors.surfaceContainerLow },
                ]}
              >
                <Text style={[styles.chipText, { color: tag === t ? colors.onPrimary : colors.onSurfaceVariant }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Goals</Text>
          <TextInput
            style={[styles.input, styles.goalsInput]}
            placeholder="Isi dalam bentuk poin"
            placeholderTextColor={colors.iconMuted}
            value={goals}
            onChangeText={setGoals}
            multiline
            textAlignVertical="top"
            onFocus={() => {
              isGoalsFocused.current = true;
            }}
            onBlur={() => {
              isGoalsFocused.current = false;
            }}
            onContentSizeChange={(e) => {
              const newHeight = e.nativeEvent.contentSize.height;
              if (isGoalsFocused.current && newHeight > prevGoalsHeight.current) {
                scrollRef.current?.scrollToEnd?.({ animated: true });
              }
              prevGoalsHeight.current = newHeight;
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Catatan tambahan (opsional)..."
            placeholderTextColor={colors.iconMuted}
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            textAlignVertical="top"
            onFocus={() => {
              isDescFocused.current = true;
            }}
            onBlur={() => {
              isDescFocused.current = false;
            }}
            onContentSizeChange={(e) => {
              const newHeight = e.nativeEvent.contentSize.height;
              if (isDescFocused.current && newHeight > prevDescHeight.current) {
                scrollRef.current?.scrollToEnd?.({ animated: true });
              }
              prevDescHeight.current = newHeight;
            }}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Absolutely positioned footer — slides up in sync with keyboard */}
      <Animated.View
        style={[styles.footer, footerAnimatedStyle]}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <Pressable
          style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Simpan</Text>
          )}
        </Pressable>
      </Animated.View>

      <DatePickerCalendar
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={setTanggal}
        selectedDate={tanggal}
      />
      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={setJam}
        selectedTime={jam}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonIcon: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts["600"],
    color: colors.onBackground,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.error,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts["400"],
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  goalsInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  descriptionInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts["400"],
    color: colors.onSurface,
  },
  dateTimePlaceholder: {
    color: colors.iconMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts["500"],
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerLow,
  },
  saveButton: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts["600"],
    color: colors.onPrimary,
  },
});
