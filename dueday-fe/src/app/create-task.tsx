import DatePickerCalendar from "@/components/DatePickerCalendar";
import TimePicker from "@/components/TimePicker";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PriorityType = "Tinggi" | "Sedang" | "Rendah" | null;
type TagType = "Kuliah" | "Pekerjaan" | "Rapat" | "Rumah";
type RepeatType = "Tidak" | "Harian" | "Mingguan" | "Bulanan" | "Tanggal Tertentu";

export default function CreateTaskPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [namatugas, setNamaTugas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [prioritas, setPrioritas] = useState<PriorityType>(null);
  const [tag, setTag] = useState<TagType | null>(null);
  const [repeat, setRepeat] = useState<RepeatType>("Tidak");
  const [deskripsi, setDeskripsi] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const tagOptions: TagType[] = ["Kuliah", "Pekerjaan", "Rapat", "Rumah"];
  const repeatOptions: RepeatType[] = ["Tidak", "Harian", "Mingguan", "Bulanan", "Tanggal Tertentu"];

  const getPriorityColor = (priority: PriorityType) => {
    if (priority === "Tinggi") return colors.error;
    if (priority === "Sedang") return colors.primaryContainer;
    if (priority === "Rendah") return colors.success;
    return colors.surfaceContainerLow;
  };

  const getPriorityTextColor = (priority: PriorityType) => {
    if (priority === "Tinggi" || priority === "Sedang" || priority === "Rendah") {
      return "#ffffff";
    }
    return colors.onSurfaceVariant;
  };

  const isTagSelected = (t: TagType) => tag === t;
  const isRepeatSelected = (r: RepeatType) => repeat === r;

  const handleSave = () => {
    console.log({
      namatugas,
      tanggal,
      jam,
      prioritas,
      tag,
      repeat,
      deskripsi,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButtonIcon}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={colors.primaryContainer}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Buat Tugas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.label}>Tanggal Waktu</Text>
          <Pressable
            style={styles.dateTimeContainer}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primaryContainer}
              style={styles.dateIcon}
            />
            <Text
              style={[
                styles.dateTimeText,
                !tanggal && styles.dateTimePlaceholder,
              ]}
            >
              {tanggal || "Pilih tanggal"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.dateTimeContainer}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.primaryContainer}
              style={styles.dateIcon}
            />
            <Text
              style={[
                styles.dateTimeText,
                !jam && styles.dateTimePlaceholder,
              ]}
            >
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
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.onPrimary : priorityColor },
                    ]}
                  >
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
                  {
                    backgroundColor: isTagSelected(t)
                      ? colors.primaryContainer
                      : colors.surfaceContainerLow,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isTagSelected(t) ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ulangi</Text>
          <View style={styles.chipRow}>
            {repeatOptions.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRepeat(r)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isRepeatSelected(r)
                      ? colors.primaryContainer
                      : colors.surfaceContainerLow,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isRepeatSelected(r) ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}
                >
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
            placeholder="Catatan tambahan (opsional)..."
            placeholderTextColor={colors.iconMuted}
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan</Text>
        </Pressable>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    fontWeight: "600",
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
    fontWeight: "600",
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
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
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
    width: "100%",
  },
  dateIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
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
    fontWeight: "500",
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  footer: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onPrimary,
  },
});
