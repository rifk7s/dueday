import DatePickerCalendar from "@/components/DatePickerCalendar";
import TimePicker from "@/components/TimePicker";
import { colors, fonts } from "@/constants/theme";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { useActivityQuery, useUpdateActivityMutation } from "@/hooks/useActivities";
import { useTagIdByName } from "@/hooks/useTags";
import { fromApiTime, toApiDate, toApiTime } from "@/api/format";
import { ULANGI_API_MAP, type Activity, type UlangiType } from "@/api/activities";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TagType = "Kuliah" | "Pekerjaan" | "Rapat" | "Rumah";
type RepeatType = "Tidak" | "Harian" | "Mingguan" | "Bulanan" | "Tanggal Tertentu";

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "";
  const dateOnly = value.split("T")[0] ?? value;
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

function repeatToUi(value: UlangiType | null | undefined): RepeatType | null {
  switch (value) {
    case "setiap_hari":
      return "Harian";
    case "satu_minggu":
      return "Mingguan";
    case "satu_bulan":
      return "Bulanan";
    case "satu_tahun":
      return "Tanggal Tertentu";
    default:
      return null;
  }
}

export default function EditActivityPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useGradualAnimation();
  const scrollRef = useRef<React.ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const prevDescHeight = useRef(0);
  const isDescFocused = useRef(false);
  const [footerHeight, setFooterHeight] = useState(80);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: activity, isLoading, error } = useActivityQuery(id, { refetchInterval: false });
  const updateMutation = useUpdateActivityMutation();
  const [validationError, setValidationError] = useState("");
  const isKeyboardVisible = useKeyboardState((s) => s.isVisible);

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
  const [initialized, setInitialized] = useState(false);
  const tagId = useTagIdByName(tag);

  const tagOptions: TagType[] = ["Kuliah", "Pekerjaan", "Rapat", "Rumah"];
  const repeatOptions: RepeatType[] = ["Tidak", "Harian", "Mingguan", "Bulanan", "Tanggal Tertentu"];

  useEffect(() => {
    if (!activity || initialized) return;

    if (activity.status === "ongoing") {
      if (Platform.OS === "android") {
        ToastAndroid.show("Tidak bisa edit saat aktivitas masih ongoing", ToastAndroid.SHORT);
      } else {
        Alert.alert("Tidak bisa edit", "Aktivitas masih ongoing. Selesaikan atau jeda dulu sebelum mengedit.");
      }
      router.back();
      return;
    }

    setNamaaktivitas(activity.activity_name ?? "");
    setTanggal(formatDisplayDate(activity.tanggal));
    setJamMulai(fromApiTime(activity.time_start ?? "") || "");
    setJamSelesai(fromApiTime(activity.time_end ?? "") || "");
    setTag((activity.tag?.nama_tag as TagType) ?? null);
    setRepeat(repeatToUi(activity.ulangi));
    setDeskripsi(activity.deskripsi ?? "");
    setInitialized(true);
  }, [activity, initialized]);

  const getTagColor = (currentTag: TagType | null): string => {
    switch (currentTag) {
      case "Kuliah":
        return colors.primaryContainer;
      case "Pekerjaan":
        return colors.success;
      case "Rapat":
        return colors.warning;
      case "Rumah":
        return colors.tertiaryContainer;
      default:
        return colors.surfaceContainerLow;
    }
  };

  const isTagSelected = (t: TagType): boolean => tag === t;
  const isRepeatSelected = (r: RepeatType): boolean => repeat === r;

  const handleSave = () => {
    if (!id || !activity) return;

    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    if (!namaaktivitas.trim()) {
      setValidationError("Nama aktivitas wajib diisi.");
      return;
    }
    if (!tanggal) {
      setValidationError("Tanggal wajib dipilih.");
      return;
    }
    if (!jamMulai || !jamSelesai) {
      setValidationError("Waktu mulai dan selesai wajib diisi.");
      return;
    }
    setValidationError("");

    const payload: Parameters<typeof updateMutation.mutate>[0]["data"] = {};
    if (namaaktivitas.trim() !== (activity.activity_name ?? "")) payload.activity_name = namaaktivitas.trim();
    if (tanggal !== formatDisplayDate(activity.tanggal)) payload.tanggal = toApiDate(tanggal);
    if (jamMulai !== (fromApiTime(activity.time_start ?? "") || "")) payload.time_start = toApiTime(jamMulai);
    if (jamSelesai !== (fromApiTime(activity.time_end ?? "") || "")) payload.time_end = toApiTime(jamSelesai);

    const selectedTagId = tagId ?? null;
    if (selectedTagId !== (activity.id_tag ?? null)) payload.id_tag = selectedTagId;

    const ulangi = repeat ? ULANGI_API_MAP[repeat] : undefined;
    const currentRepeat = activity.ulangi ?? null;
    if (ulangi !== currentRepeat) payload.ulangi = ulangi;

    if ((deskripsi.trim() || null) !== (activity.deskripsi ?? null)) {
      payload.deskripsi = deskripsi.trim() || undefined;
    }

    updateMutation.mutate(
      {
        id,
        data: payload,
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

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: top }]}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={[styles.centered, { paddingTop: top }]}>
        <Text style={styles.emptyText}>Aktivitas tidak ditemukan.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButtonIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Aktivitas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footerHeight + 16}
      >
        {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
        {updateMutation.isError ? (
          <Text style={styles.errorText}>
            {updateMutation.error instanceof Error ? updateMutation.error.message : "Gagal menyimpan aktivitas."}
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
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tanggal</Text>
          <Pressable style={styles.dateTimeContainer} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !tanggal && styles.dateTimePlaceholder]}>
              {tanggal || "Pilih tanggal"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Waktu</Text>
          <View style={styles.timeRow}>
            <Pressable
              style={[styles.dateTimeContainer, styles.timeContainer]}
              onPress={() => setShowTimePickerMulai(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
              <Text style={[styles.dateTimeText, !jamMulai && styles.dateTimePlaceholder]}>
                {jamMulai || "Mulai"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.dateTimeContainer, styles.timeContainer]}
              onPress={() => setShowTimePickerSelesai(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primaryContainer} style={styles.dateIcon} />
              <Text style={[styles.dateTimeText, !jamSelesai && styles.dateTimePlaceholder]}>
                {jamSelesai || "Selesai"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.chipsRow}>
            {tagOptions.map((t) => {
              const selected = isTagSelected(t);
              const chipColor = selected ? getTagColor(t) : colors.surfaceContainerLow;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTag(tag === t ? null : t)}
                  style={[styles.chip, { backgroundColor: chipColor }]}
                >
                  <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.onSurfaceVariant }]}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ulangi</Text>
          <View style={styles.chipsRow}>
            {repeatOptions.map((r) => {
              const selected = isRepeatSelected(r);
              return (
                <Pressable
                  key={r}
                  onPress={() => setRepeat(repeat === r ? null : r)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerLow },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.onSurfaceVariant }]}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput, styles.savedText]}
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

      <Animated.View
        style={[styles.footer, footerAnimatedStyle]}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <Pressable
          style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
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
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  savedText: {
    color: colors.onSurfaceVariant,
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
    color: colors.onSurfaceVariant,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 12,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backLinkText: {
    color: colors.primaryContainer,
    fontFamily: fonts["700"],
    fontSize: 14,
  },
});
