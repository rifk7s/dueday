import { fromApiTime } from "@/api/format";
import { PRIORITY_DISPLAY, type Task } from "@/api/tasks";
import GoalsChecklistModal from "@/components/GoalsChecklistModal";
import { ProgressCard } from "@/components/ProgressCard";
import { colors, fonts, typography } from "@/constants/theme";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { goBackOr } from "@/constants/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTHS_ID_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  high: { bg: colors.errorSoft, text: colors.errorStrong },
  medium: { bg: colors.surfaceWarm, text: colors.warning },
  low: { bg: colors.surfaceSuccess, text: colors.success },
};

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const ymd = iso.substring(0, 10);
  const [yyyy, mm, dd] = ymd.split("-");
  const idx = Number.parseInt(mm, 10) - 1;
  return `${Number.parseInt(dd, 10)} ${MONTHS_ID_FULL[idx] ?? ""} ${yyyy}`;
}

function formatDottedTime(hms: string | null | undefined): string {
  const hm = fromApiTime(hms);
  return hm ? hm.replace(":", ".") : "";
}

function parseGoals(task: Task): string[] {
  if (task.goal_points && task.goal_points.length > 0) {
    return task.goal_points.map((g) => g.text);
  }
  if (task.goals) {
    return task.goals
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default function TaskProgressScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: tasks = [], isLoading, isError } = useTasksQuery();
  const task = tasks.find((t) => t.id === id);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: top }]}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  if (isError || !task) {
    return (
      <View style={[styles.centered, { paddingTop: top }]}>
        <Text style={styles.emptyText}>Tugas tidak ditemukan.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const priorityKey = task.priority ?? "";
  const priorityLabel = PRIORITY_DISPLAY[priorityKey];
  const priorityColor = PRIORITY_BADGE[priorityKey];

  const datePart = formatLongDate(task.date);
  const timePart = formatDottedTime(task.time);
  const deadline = [datePart, timePart].filter(Boolean).join(" | ");

  const goals = parseGoals(task);

  // Local UI state for showing the goals checklist modal and tracking progress locally
  const [modalVisible, setModalVisible] = useState(false);
  // savedChecks stores per-task saved checkbox state so it persists across modal opens
  const [savedChecks, setSavedChecks] = useState<Record<string, Record<number, boolean>>>({});
  const [localProgress, setLocalProgress] = useState<number>(task.progress ?? 0);
  const onModalSave = (newMap: Record<number, boolean>) => {
    const prevMap = savedChecks[task.id] ?? {};
    const prevCheckedCount = Object.values(prevMap).filter(Boolean).length;
    const newCheckedCount = Object.values(newMap).filter(Boolean).length;
    const deltaChecked = Math.max(0, newCheckedCount - prevCheckedCount);

    if (goals.length > 0 && deltaChecked > 0) {
      const increment = Math.round((deltaChecked / goals.length) * 100);
      setLocalProgress((p) => Math.min(100, p + increment));
    }

    setSavedChecks((prev) => ({ ...prev, [task.id]: { ...(prev[task.id] ?? {}), ...newMap } }));
    setModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => goBackOr({ pathname: "/list", params: { tab: "tugas" } })} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
          </Pressable>
          <Text style={styles.headerTitle}>Progress Tugas</Text>
          <Pressable hitSlop={12}>
            <Ionicons name="create-outline" size={24} color={colors.primaryContainer} />
          </Pressable>
        </View>

        <ProgressCard
          title={task.task_name}
          progress={localProgress}
          onUpdatePress={() => {
            setModalVisible(true);
          }}
        />

        {priorityLabel && priorityColor ? (
          <View style={styles.priorityRow}>
            <Text style={styles.priorityLabel}>Prioritas:</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor.bg }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityColor.text }]}>
                {priorityLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {deadline ? (
          <>
            <SectionLabel label="TENGGAT WAKTU" />
            <View style={styles.deadlinePill}>
              <Ionicons name="calendar-outline" size={16} color={colors.onSurface} />
              <Text style={styles.deadlineText}>{deadline}</Text>
            </View>
          </>
        ) : null}

        {goals.length > 0 ? (
          <>
            <SectionLabel label="GOALS" />
            <View style={styles.goalList}>
              {goals.map((g, i) => (
                <View key={`${i}-${g}`} style={styles.goalRow}>
                  <Text style={styles.goalBullet}>•</Text>
                  <Text style={styles.goalText}>{g}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {task.deskripsi ? (
          <>
            <SectionLabel label="DESKRIPSI" />
            <Text style={styles.description}>{task.deskripsi}</Text>
          </>
        ) : null}

        {task.tag?.nama_tag ? (
          <>
            <SectionLabel label="TAG" />
            <View style={styles.tagRow}>
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>{task.tag.nama_tag}</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
      <GoalsChecklistModal
        visible={modalVisible}
        goals={goals}
        initialChecked={savedChecks[task.id] ?? {}}
        onClose={() => setModalVisible(false)}
        onSave={onModalSave}
      />
    </View>
  );
}

function SectionLabel({ label }: Readonly<{ label: string }>) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.surfaceContainerLowest,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 12,
  },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: {
    color: colors.primaryContainer,
    fontFamily: fonts["700"],
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  priorityLabel: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontFamily: fonts["800"],
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 15,
    fontFamily: fonts["800"],
    color: colors.primaryContainer,
  },
  deadlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    alignSelf: "stretch",
  },
  deadlineText: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurface,
  },
  goalList: { gap: 6 },
  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  goalBullet: {
    fontSize: 16,
    fontFamily: fonts["700"],
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
  },
  tagRow: { flexDirection: "row" },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surfaceContainerLowest,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts["700"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  checkboxCheck: {
    color: colors.onPrimary,
    fontFamily: fonts["700"],
  },
  modalRowTitle: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});
