import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

export default function ListActivityPage() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<"Semua" | "Selesai" | "Pekerjaan" | "Rapat">("Semua");

  useFocusEffect(
    React.useCallback(() => {
      setActiveFilter("Semua");
    }, [])
  );

  const shouldShowCard = (category: string, status: string) => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Selesai") return status === "done";
    return category === activeFilter;
  };

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.title}>List</Text>
        <Pressable style={styles.iconButton} accessibilityRole="button">
          <Ionicons name="search" size={20} color={colors.iconMuted} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/list")}
          style={[styles.tabButton]}
        >
          <Text style={[styles.tabLabel]}>Tugas</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[styles.tabButton, styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Aktivitas</Text>
        </Pressable>
      </View>

      {/* Filter chips below tabs */}
      <View style={styles.filterRow}>
        {[
          "Semua",
          "Selesai",
          "Pekerjaan",
          "Rapat",
        ].map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f as typeof activeFilter)}
            style={[styles.chip, f === activeFilter ? styles.chipActive : null]}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, f === activeFilter ? styles.chipTextActive : null]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {shouldShowCard("Rumah", "open") && (
          <ActivityCard
            progress={0}
            deadline="30 April 2026 | 08.00 - 09.00"
            title="Olahraga Pagi"
            description="Lari pagi keliling taman kota untuk menjaga kesehatan..."
            category="Rumah"
            status="open"
          />
        )}
        {shouldShowCard("Rapat", "open") && (
          <ActivityCard
            accentColor={colors.primaryContainer}
            stateText="RAPAT"
            progress={0.5}
            deadline="24 April 2026 | 13.00-14.30"
            title="Rapat REM"
            description="Final review untuk project Dueday App"
            category="Rapat"
            status="open"
          />
        )}
        {shouldShowCard("Pekerjaan", "open") && (
          <ActivityCard
            accentColor={colors.surfaceWarm}
            stateText="PEKERJAN"
            progress={0.5}
            deadline="30 April 2026 | 13.00-14.30"
            title="Evaluasi Bulanan"
            description="Penilaian kinerja selama satu bulan serto identifikasi..."
            category="Pekerjaan"
            status="open"
          />
        )}
        {shouldShowCard("Pekerjaan", "done") && (
          <ActivityCard
            accentColor={colors.success}
            stateText="SELESAI"
            deadline="31 Desember 2025 | 13.30 - 14.30"
            title="Briefing Tim"
            description="Diskusi dengan tim developer."
            category="Pekerjaan"
            status="done"
          />
        )}
        {shouldShowCard("Pekerjaan", "done") && (
          <ActivityCard
            accentColor={colors.success}
            stateText="SELESAI"
            deadline="20 Desember 2025 | 08.00 - 09.00"
            title="Melakukan Riset"
            description="Menganalisis fitur aplikasi sejenis."
            category="Pekerjaan"
            status="done"
          />
        )}
        {shouldShowCard("Pekerjaan", "done") && (
          <ActivityCard
            accentColor={colors.success}
            stateText="SELESAI"
            deadline="18 Desember 2025 | 08.00 - 09.00"
            title="Rapat Mingguan"
            description="Rapat untuk melihat hasil mingguan"
            category="Pekerjaan"
            status="done"
          />
        )}
      </ScrollView>
    </View>
  );
}

type ActivityCardProps = {
  accentColor?: string;
  stateText?: string;
  deadline?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: "open" | "done";
  progress?: number;
};

function ActivityCard({
  accentColor = colors.error,
  stateText = "AKTIVITAS",
  deadline = "30 April 2026 | 08.00 - 09.00",
  title = "Aktivitas",
  description = "Deskripsi aktivitas",
  category = "Rumah",
  status = "open",
  progress = 0,
}: ActivityCardProps) {
  return (
    <View style={styles.taskCard}>
      <View style={[styles.taskAccent, { backgroundColor: accentColor }]} />
      <View style={styles.taskHeaderRow}>
        <View style={styles.deadlineRow}>
          <Ionicons name={status === "done" ? "checkmark-circle-outline" : "warning-outline"} size={14} color={status === "done" ? colors.success : colors.error} />
          <Text style={[styles.deadlineText, status === "done" && styles.deadlineTextDone]}>{deadline}</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={16} color={colors.iconMuted} />
      </View>

      <View style={styles.taskMainRow}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{title}</Text>
          <Text style={styles.taskDescription}>{description}</Text>

          <View style={styles.tagRow}>
            <View style={[styles.tag, status === "done" ? styles.doneTag : styles.priorityTag]}>
              <Text style={styles.priorityTagText}>{stateText}</Text>
            </View>
            <View style={[styles.tag, styles.categoryTag]}>
              <Text style={styles.categoryTagText}>{category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressWrap}>
          {status === "done" ? (
            <View style={[styles.doneCircle, { borderColor: colors.success }]}>
              <Ionicons name="checkmark" size={18} color={colors.success} />
            </View>
          ) : (
            <ProgressRing progress={progress} size={56} strokeWidth={5} />
          )}
        </View>
      </View>
    </View>
  );
}

function ProgressRing({ progress, size, strokeWidth }: { progress: number; size: number; strokeWidth: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primaryContainer}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          fill="none"
        />
      </Svg>
      <View style={styles.progressLabel}>
        <Text style={styles.progressText}>{Math.round(clamped * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  headerRow: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0,
  },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: typography.h2.fontSize, fontFamily: fonts["900"], color: colors.onSurface },
  tabRow: { flexDirection: "row", gap: 60, paddingHorizontal: 18, paddingTop: 12, justifyContent: "center", alignItems: "center" },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabButtonActive: { borderBottomColor: colors.primaryContainer },
  tabLabel: { color: colors.iconMuted, fontFamily: fonts["700"], fontSize: 15 },
  tabLabelActive: { color: colors.primaryContainer, fontFamily: fonts["900"] },
  content: { padding: 16, paddingBottom: 120 },
  filterRow: { flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, alignItems: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0,
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurfaceVariant, fontFamily: fonts["700"] },
  chipTextActive: { color: colors.onPrimary },
  taskCard: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    marginBottom: 14,
  },
  taskAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  taskHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deadlineText: { color: colors.error, fontFamily: fonts["700"], fontSize: 12 },
  deadlineTextDone: { color: colors.success },
  taskMainRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, lineHeight: 20, color: colors.onSurface, fontFamily: fonts["900"] },
  taskDescription: { marginTop: 6, fontSize: 13, fontFamily: fonts["400"], color: colors.tertiary },
  tagRow: { marginTop: 10, flexDirection: "row", gap: 8 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  priorityTag: { backgroundColor: colors.errorSoft },
  doneTag: { backgroundColor: colors.surfaceSuccess },
  categoryTag: { backgroundColor: colors.primaryContainer },
  priorityTagText: { color: colors.errorStrong, fontSize: 12, fontFamily: fonts["800"] },
  categoryTagText: { color: colors.onPrimary, fontSize: 12, fontFamily: fonts["800"] },
  progressWrap: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  progressLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: { color: colors.primaryContainer, fontSize: 12, fontFamily: fonts["800"] },
  doneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
  },
});
