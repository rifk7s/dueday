import { ULANGI_API_MAP } from "@/api/activities";
import { toApiDate, toApiTime } from "@/api/format";
import DatePickerCalendar from "@/components/DatePickerModal";
import TimePicker from "@/components/TimePickerModal";
import { colors, fonts } from "@/constants/theme";
import { useCreateActivityMutation } from "@/hooks/useActivities";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { useTagIdByName } from "@/hooks/useTags";
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
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import { KeyboardAwareScrollView, useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TagType = "Kuliah" | "Pekerjaan" | "Rapat" | "Rumah";
type RepeatType = "Tidak" | "Harian" | "Mingguan" | "Bulanan";

export default function CreateActivityPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useGradualAnimation();
  const scrollRef = useRef<React.ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const prevDescHeight = useRef(0);
  const isDescFocused = useRef(false);
  const [footerHeight, setFooterHeight] = useState(80);

  const [namaaktivitas, setNamaaktivitas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [tag, setTag] = useState<TagType | null>(null);
  const [repeat, setRepeat] = useState<RepeatType | null>(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePickerMulai, setShowTimePickerMulai] = useState(false);
  const [showTimePickerSelesai, setShowTimePickerSelesai] = useState(false);

  const tagOptions: TagType[] = ["Kuliah", "Pekerjaan", "Rapat", "Rumah"];
  const repeatOptions: RepeatType[] = ["Tidak", "Harian", "Mingguan", "Bulanan"];

  const mutation = useCreateActivityMutation();
  const tagId = useTagIdByName(tag);
  const [validationError, setValidationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isKeyboardVisible = useKeyboardState((s) => s.isVisible);

  const isTagSelected = (t: TagType): boolean => tag === t;
  const isRepeatSelected = (r: RepeatType): boolean => repeat === r;

  const handleSave = () => {
    // Two-stage save: first tap dismisses keyboard so the user can see the full
    // form and verify required pickers (tanggal/waktu) before committing.
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    const missing: string[] = [];
    const errs: Record<string, string> = {};
    if (!namaaktivitas.trim()) {
      missing.push("Nama aktivitas");
      errs["namaaktivitas"] = "Nama aktivitas wajib diisi.";
    }
    if (!tanggal) {
      missing.push("Tanggal");
      errs["tanggal"] = "Tanggal wajib dipilih.";
    }
    if (!jamMulai) {
      missing.push("Jam mulai");
      errs["jamMulai"] = "Jam mulai wajib diisi.";
    }
    if (!jamSelesai) {
      missing.push("Jam selesai");
      errs["jamSelesai"] = "Jam selesai wajib diisi.";
    }

    if (missing.length > 0) {
      setFieldErrors(errs);
      // scroll to top so user sees field-level errors
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
      return;
    }
    setFieldErrors({});
    setValidationError("");
    setFieldErrors({});

    const payload: Parameters<typeof mutation.mutate>[0] = {
      activity_name: namaaktivitas.trim(),
      status: "not_started",
    };
    if (tanggal) payload.tanggal = toApiDate(tanggal);
    if (jamMulai) payload.time_start = toApiTime(jamMulai);
    if (jamSelesai) payload.time_end = toApiTime(jamSelesai);
    if (tagId != null) payload.id_tag = tagId;
    const ulangi = repeat ? ULANGI_API_MAP[repeat] : undefined;
    if (ulangi) payload.ulangi = ulangi;
    if (deskripsi.trim()) payload.deskripsi = deskripsi.trim();

    mutation.mutate(payload, { onSuccess: () => router.back() });
  };

  // Footer slides up with keyboard. paddingBottom shrinks to 16 when keyboard
  // is open because e.height already includes the bottom safe area inset.
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    bottom: height.value,
    paddingBottom: interpolate(
      height.value,
      [0, 1],
      [bottom + 16, 16],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButtonIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Buat Aktivitas</Text>
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
        {mutation.isError ? (
          <Text style={styles.errorText}>
            {mutation.error instanceof Error ? mutation.error.message : "Gagal menyimpan aktivitas."}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Nama Aktivitas</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Olahraga pagi"
            placeholderTextColor={colors.iconMuted}
            value={namaaktivitas}
            onChangeText={setNamaaktivitas}
          />
          {fieldErrors["namaaktivitas"] ? (
            <Text style={styles.fieldError}>{fieldErrors["namaaktivitas"]}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tanggal</Text>
          <Pressable style={styles.dateTimeContainer} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !tanggal && styles.dateTimePlaceholder]}>
              {tanggal || "Pilih tanggal"}
            </Text>
          </Pressable>
          {fieldErrors["tanggal"] ? (
            <Text style={styles.fieldError}>{fieldErrors["tanggal"]}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Waktu</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Pressable
                style={[styles.dateTimeContainer, styles.timeContainer]}
                onPress={() => setShowTimePickerMulai(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
                <Text style={[styles.dateTimeText, !jamMulai && styles.dateTimePlaceholder]}>
                  {jamMulai || "Mulai"}
                </Text>
              </Pressable>
              {fieldErrors["jamMulai"] ? (
                <Text style={styles.fieldError}>{fieldErrors["jamMulai"]}</Text>
              ) : null}
            </View>
            <View style={styles.timeColumn}>
              <Pressable
                style={[styles.dateTimeContainer, styles.timeContainer]}
                onPress={() => setShowTimePickerSelesai(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
                <Text style={[styles.dateTimeText, !jamSelesai && styles.dateTimePlaceholder]}>
                  {jamSelesai || "Selesai"}
                </Text>
              </Pressable>
              {fieldErrors["jamSelesai"] ? (
                <Text style={styles.fieldError}>{fieldErrors["jamSelesai"]}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.chipsRow}>
            {tagOptions.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTag(tag === t ? null : t)}
                style={[styles.chip, { backgroundColor: isTagSelected(t) ? colors.primaryContainer : colors.surfaceContainerLow }]}
              >
                <Text style={[styles.chipText, { color: isTagSelected(t) ? colors.onPrimary : colors.onSurfaceVariant }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ulangi</Text>
          <View style={styles.chipsRow}>
            {repeatOptions.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRepeat(repeat === r ? null : r)}
                style={[styles.chip, { backgroundColor: isRepeatSelected(r) ? colors.primaryContainer : colors.surfaceContainerLow }]}
              >
                <Text style={[styles.chipText, { color: isRepeatSelected(r) ? colors.onPrimary : colors.onSurfaceVariant }]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Catatan (opsional)..."
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
        visible={showTimePickerMulai}
        onClose={() => setShowTimePickerMulai(false)}
        onTimeSelect={setJamMulai}
        selectedTime={jamMulai}
      />
      <TimePicker
        visible={showTimePickerSelesai}
        onClose={() => setShowTimePickerSelesai(false)}
        onTimeSelect={setJamSelesai}
        selectedTime={jamSelesai}
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
    marginBottom: 4,
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
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeContainer: {
    flex: 1,
    marginBottom: 0,
  },
  timeColumn: {
    flex: 1,
  },
  chipsRow: {
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
  errorText: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.error,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  fieldError: {
    marginTop: 2,
    color: colors.error,
    fontSize: 13,
    fontFamily: fonts["500"],
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
