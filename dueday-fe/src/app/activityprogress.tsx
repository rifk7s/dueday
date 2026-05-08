import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ActivityProgressParams = {
  title?: string;
  date?: string;
  startHour?: string;
  endHour?: string;
  color?: string;
  accent?: string;
};

export default function ActivityProgressScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { title, date, startHour, endHour, color, accent } = useLocalSearchParams<ActivityProgressParams>();

  const activityTitle = typeof title === "string" ? title : "Activity";
  const activityDate = typeof date === "string" ? formatDateLabel(date) : "-";
  const activityStartHour = typeof startHour === "string" ? formatClock(startHour) : "08.00";
  const activityEndHour = typeof endHour === "string" ? formatClock(endHour) : "09.00";
  const ringColor = typeof color === "string" ? color : colors.primaryContainer;
  const accentColor = typeof accent === "string" ? accent : colors.primaryContainer;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
          </Pressable>
          <Text style={styles.headerTitle}>Activity Progress</Text>
          <Pressable hitSlop={12}>
            <Ionicons name="create-outline" size={24} color={colors.primaryContainer} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderAccent} />
          <Text style={styles.activityTitle}>{activityTitle}</Text>

          <View style={styles.cardTimeRow}>
            <InfoChip label={`Mulai: ${activityStartHour}`} tone="warm" />
            <InfoChip label={`Selesai: ${activityEndHour}`} tone="warm" />
          </View>

          <View style={[styles.progressRingOuter, { borderColor: ringColor }]}>
            <View style={styles.progressRingInner}>
              <Text style={[styles.progressValue, { color: accentColor }]}>0%</Text>
            </View>
          </View>

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Mulai</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Ubah Jadwal</Text>
          </Pressable>

          <Pressable style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Batalkan</Text>
          </Pressable>
        </View>

        <SectionLabel label="WAKTU" />
        <View style={styles.chipRow}>
          <InfoChip label={`Mulai: ${activityStartHour}`} tone="warm" />
          <InfoChip label={`Selesai: ${activityEndHour}`} tone="warm" />
        </View>

        <SectionLabel label="TANGGAL" />
        <View style={styles.singleChipRow}>
          <InfoChip label={activityDate} tone="cool" />
        </View>

        <SectionLabel label="DESKRIPSI" />
        <Text style={styles.description}>
          Lari pagi keliling taman kota untuk menjaga kesehatan dan kebugaran tubuh sebelum memulai
          aktivitas perkuliahan.
        </Text>

        <SectionLabel label="TAG" />
        <View style={styles.singleChipRow}>
          <InfoChip label="Rumah" tone="outline" />
        </View>

        <SectionLabel label="PENGULANGAN" />
        <Text style={styles.repeatText}>Setiap Hari</Text>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: Readonly<{ label: string }>) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function InfoChip({
  label,
  tone,
}: Readonly<{
  label: string;
  tone: "warm" | "cool" | "outline";
}>) {
  return (
    <View style={[styles.chip, styles[`chip_${tone}`]]}>
      <Text style={[styles.chipText, styles[`chipText_${tone}`]]}>{label}</Text>
    </View>
  );
}

function formatClock(value: string): string {
  const hour = Number(value);
  if (Number.isNaN(hour)) {
    return value;
  }
  return `${hour.toString().padStart(2, "0")}.00`;
}

function formatDateLabel(value: string): string {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) {
    return value;
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const monthIndex = Number(month) - 1;
  const monthLabel = monthNames[monthIndex] ?? month;
  return `${Number(day)} ${monthLabel} ${year}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    overflow: "hidden",
  },
  cardHeaderAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primaryContainer,
  },
  activityTitle: {
    textAlign: "center",
    fontSize: 17,
    fontFamily: fonts["600"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  progressRingOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 8,
    borderColor: colors.progressTrack,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  progressRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
  },
  progressValue: {
    fontSize: 24,
    fontFamily: fonts["700"],
    color: colors.primaryContainer,
  },
  primaryButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
  },
  secondaryButtonText: {
    color: colors.primaryContainer,
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
  },
  ghostButton: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ff6b6b",
  },
  ghostButtonText: {
    color: "#ff6b6b",
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 15,
    fontFamily: fonts["800"],
    color: colors.primaryContainer,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardTimeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  singleChipRow: {
    flexDirection: "row",
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  chip_warm: {
    backgroundColor: "#FFF2E6",
  },
  chip_cool: {
    backgroundColor: "#DDE7F7",
  },
  chip_outline: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  chipText: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["500"],
  },
  chipText_warm: {
    color: colors.primaryContainer,
  },
  chipText_cool: {
    color: colors.onSurface,
  },
  chipText_outline: {
    color: colors.tertiary,
  },
  description: {
    fontSize: typography.bodySm.fontSize,
    lineHeight: 22,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
  },
  repeatText: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
});
