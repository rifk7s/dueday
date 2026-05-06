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

type TagType = "Kuliah" | "Pekerjaan" | "Rapat" | "Rumah";
type RepeatType = "Tidak" | "Harian" | "Mingguan" | "Bulanan" | "Tanggal Tertentu";

export default function CreateActivityPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

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
  const repeatOptions: RepeatType[] = [
    "Tidak",
    "Harian",
    "Mingguan",
    "Bulanan",
    "Tanggal Tertentu",
  ];

  const isTagSelected = (t: TagType): boolean => tag === t;
  const isRepeatSelected = (r: RepeatType): boolean => repeat === r;

  const handleSave = () => {
    console.log({
      namaaktivitas,
      tanggal,
      jamMulai,
      jamSelesai,
      tag,
      repeat,
      deskripsi,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: top }]}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Buat Aktivitas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nama Aktivitas */}
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

        {/* Tanggal */}
        <View style={styles.section}>
          <Text style={styles.label}>Tanggal</Text>
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
        </View>

        {/* Waktu */}
        <View style={styles.section}>
          <Text style={styles.label}>Waktu</Text>
          <View style={styles.timeRow}>
            <Pressable
              style={[styles.dateTimeContainer, styles.timeContainer]}
              onPress={() => setShowTimePickerMulai(true)}
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
                  !jamMulai && styles.dateTimePlaceholder,
                ]}
              >
                {jamMulai || "Mulai"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.dateTimeContainer, styles.timeContainer]}
              onPress={() => setShowTimePickerSelesai(true)}
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
                  !jamSelesai && styles.dateTimePlaceholder,
                ]}
              >
                {jamSelesai || "Selesai"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tag */}
        <View style={styles.section}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.chipsRow}>
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
                    {
                      color: isTagSelected(t)
                        ? colors.onPrimary
                        : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ulangi */}
        <View style={styles.section}>
          <Text style={styles.label}>Ulangi</Text>
          <View style={styles.chipsRow}>
            {repeatOptions.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRepeat(repeat === r ? null : r)}
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
                    {
                      color: isRepeatSelected(r)
                        ? colors.onPrimary
                        : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Deskripsi */}
        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Catatan (opsional)..."
            placeholderTextColor={colors.iconMuted}
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan</Text>
        </Pressable>
      </View>

      {/* Date Picker Calendar */}
      <DatePickerCalendar
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={setTanggal}
        selectedDate={tanggal}
      />

      {/* Time Picker Mulai */}
      <TimePicker
        visible={showTimePickerMulai}
        onClose={() => setShowTimePickerMulai(false)}
        onTimeSelect={setJamMulai}
        selectedTime={jamMulai}
      />

      {/* Time Picker Selesai */}
      <TimePicker
        visible={showTimePickerSelesai}
        onClose={() => setShowTimePickerSelesai(false)}
        onTimeSelect={setJamSelesai}
        selectedTime={jamSelesai}
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
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
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
    fontWeight: "500",
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
  blankContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
