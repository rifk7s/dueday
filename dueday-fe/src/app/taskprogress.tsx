import { fromApiTime } from "@/api/format";
import { PRIORITY_DISPLAY, type GoalPoint } from "@/api/tasks";
import GoalsChecklistModal from "@/components/GoalsChecklistModal";
import { ProgressCard } from "@/components/ProgressCard";
import { colors, fonts, typography } from "@/constants/theme";
import { useTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { goBackOr } from "@/constants/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTHS_ID_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

// Combined mapping supporting both English and Indonesian status keys
const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  high: { bg: colors.errorSoft, text: colors.errorStrong },
  tinggi: { bg: colors.errorSoft, text: colors.errorStrong },
  
  medium: { bg: colors.surfaceWarm, text: colors.warning },
  sedang: { bg: colors.surfaceWarm, text: colors.warning },
  
  low: { bg: colors.surfaceSuccess, text: colors.success },
  rendah: { bg: colors.surfaceSuccess, text: colors.success },
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

function buildGoalPoints(task: any): GoalPoint[] {
  if (task.goal_points && task.goal_points.length > 0) {
    return task.goal_points;
  }

  if (task.goals) {
    return task.goals
      .split("\n")
      .map((line: string, index: number) => {
        const trimmed = line.trim();
        const match = trimmed.match(/^[-•]\s*\[(?<state>[+ xX ])\]\s*(?<text>.+)$/);

        if (match?.groups?.text) {
          return {
            id: index + 1,
            text: match.groups.text.trim(),
            completed: match.groups.state === "+",
          };
        }

        return {
          id: index + 1,
          text: trimmed.replace(/^[-•]\s*/, ""),
          completed: false,
        };
      })
      .filter((goalPoint: GoalPoint) => goalPoint.text.length > 0);
  }

  return [];
}

export default function TaskProgressScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const [modalVisible, setModalVisible] = useState(false);
  const qc = useQueryClient();

  const { data: tasks = [], isLoading, isError } = useTasksQuery();
  
  // Find task and cast it to any to bypass strict unmapped interface type rules
  const rawTask = tasks.find((t) => t.id === id);
  const task = rawTask ? (rawTask as any) : null;

  const goalPoints = task ? buildGoalPoints(task) : [];
  const completedGoalCount = goalPoints.filter((goalPoint) => goalPoint.completed).length;
  const calculatedProgress = goalPoints.length > 0 ? Math.round((completedGoalCount / goalPoints.length) * 100) : task?.progress ?? 0;

  const isElearnSource =
    task?.source?.toLowerCase() === "elearn" ||
    task?.tag?.nama_tag?.toLowerCase() === "elearn";

  const handleSaveGoals = (updatedGoalPoints: GoalPoint[]) => {
    if (!task || isElearnSource) return;

    updateTaskMutation.mutate(
      {
        id: task.id,
        data: { goal_points: updatedGoalPoints },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
          setModalVisible(false);
        },
      },
    );
  };

  const handleDeleteTask = () => {
    if (!task?.id || isElearnSource) return;

    const message = "Apakah Anda yakin ingin menghapus tugas ini?";

    if (Platform.OS === "web") {
      const confirmDelete = window.confirm(message);
      if (confirmDelete) {
        deleteTaskMutation.mutate(task.id, {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
            window.alert("Tugas berhasil dihapus.");
            router.replace({ pathname: "/list", params: { tab: "tugas" } });
          },
          onError: (err) => {
            console.error(err);
            window.alert("Gagal menghapus tugas. Silakan coba lagi.");
          }
        });
      }
    } else {
      Alert.alert(
        "Hapus Tugas",
        message,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: () => {
              deleteTaskMutation.mutate(task.id, {
                onSuccess: () => {
                  qc.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
                  if (Platform.OS === "android") {
                    ToastAndroid.show("Tugas berhasil dihapus", ToastAndroid.SHORT);
                  }
                  router.replace({ pathname: "/list", params: { tab: "tugas" } });
                },
                onError: (err) => {
                  console.error(err);
                  Alert.alert("Error", "Gagal menghapus tugas. Silakan coba lagi.");
                }
              });
            }
          }
        ]
      );
    }
  };

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
  const priorityLabel = PRIORITY_DISPLAY[priorityKey] || (priorityKey === "sedang" ? "Sedang" : priorityKey);
  const priorityColor = PRIORITY_BADGE[priorityKey];

  // Map to unified schema attributes
  const datePart = formatLongDate(task.due_date ?? task.date);
  const timePart = formatDottedTime(task.due_time ?? task.time);
  const deadline = [datePart, timePart].filter(Boolean).join(" | ");

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + 8, paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => goBackOr({ pathname: "/list", params: { tab: "tugas" } })} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
          </Pressable>
          
          <Text style={styles.headerTitle}>Progress Tugas</Text>
          
          <View style={styles.headerActions}>
            {!isElearnSource && (
              <Pressable hitSlop={12} onPress={handleDeleteTask} style={styles.headerActionButton}>
                <Ionicons name="trash-outline" size={24} color={colors.errorStrong} />
              </Pressable>
            )}
            
            <Pressable hitSlop={12} onPress={() => router.push({ pathname: "/edit-task", params: { id: task.id } })}>
              <Ionicons name="create-outline" size={24} color={colors.primaryContainer} />
            </Pressable>
          </View>
        </View>

        <ProgressCard
          title={task.name ?? task.task_name}
          progress={calculatedProgress}
          hideUpdateButton={isElearnSource} 
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

        {goalPoints.length > 0 ? (
          <>
            <SectionLabel label="GOALS" />
            <View style={styles.goalList}>
              {goalPoints.map((goalPoint) => (
                <View key={goalPoint.id} style={styles.goalRow}>
                  <Ionicons
                    name={goalPoint.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={goalPoint.completed ? colors.success : colors.onSurfaceVariant}
                    style={styles.goalIcon}
                  />
                  <Text style={[styles.goalText, goalPoint.completed && styles.goalTextCompleted]}>
                    {goalPoint.text}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {(task.description || task.deskripsi) ? (
          <>
            <SectionLabel label="DESKRIPSI" />
            <Text style={styles.description}>{task.description ?? task.deskripsi}</Text>
          </>
        ) : null}

        {isElearnSource && (
          <>
            <SectionLabel label="SUMBER TUGAS" />
            <View style={styles.tagRow}>
              <View style={styles.elearnBadge}>
                <Text style={styles.elearnBadgeText}>ELEARN</Text>
              </View>
            </View>
          </>
        )}

        {task.tag?.nama_tag && task.tag.nama_tag.toLowerCase() !== "elearn" ? (
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
        goalPoints={goalPoints}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoals}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    marginRight: 16,
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
  goalIcon: { marginTop: 1 },
  goalText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
  },
  goalTextCompleted: {
    color: colors.success,
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
  elearnBadge: {
    backgroundColor: "#2B63E3",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  elearnBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: fonts["800"],
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fonts["400"],
    color: (colors as any).primaryContainerLight ?? "rgba(255,255,255,0.7)",
  },
  progressPercent: {
    fontSize: 24,
    fontFamily: fonts["800"],
    color: colors.onPrimary,
  },
  track: {
    height: 8,
    backgroundColor: (colors as any).primaryContainerDark ?? "rgba(0,0,0,0.15)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
});