import { fromApiDate, fromApiTime } from "@/api/format";
import { PRIORITY_DISPLAY, type Task } from "@/api/tasks";
import { ULANGI_DISPLAY, type Activity } from "@/api/activities";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery, useDeleteActivityMutation } from "@/hooks/useActivities";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { goBackOr } from "@/constants/navigation";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform, // Added for platform evaluation checks
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

type Tab = "tugas" | "aktivitas";
type StateColor = { bg: string; text: string };

type ListItem = {
  id: string;
  itemType: "task" | "activity";
  accentColor?: string;
  stateText?: string;
  stateColor?: StateColor;
  deadline?: string;
  title?: string;
  description?: string;
  category: string;
  showCategoryTag: boolean;
  status: "open" | "done";
  rawStatus: string;
  progress?: number;
};

const PRIORITY_COLOR: Record<string, StateColor> = {
  high: { bg: colors.errorSoft, text: colors.errorStrong },
  medium: { bg: colors.surfaceWarm, text: colors.warning },
  low: { bg: colors.surfaceSuccess, text: colors.success },
};

const DONE_COLOR: StateColor = { bg: colors.surfaceContainerLow, text: colors.onSurfaceVariant };

function isTaskDone(status: Task["status"]): boolean {
  return status === "completed" || status === "completed_late";
}

function taskToListItem(task: Task): ListItem {
  const datePart = fromApiDate(task.date);
  const timePart = task.time ? fromApiTime(task.time) : "";
  const deadline = [datePart, timePart].filter(Boolean).join(" | ");
  const isDone = isTaskDone(task.status);

  const isOverdue = !isDone && (task.is_overdue ?? (task.date ? new Date((task.date ?? "") + " " + (task.time ?? "00:00:00")) < new Date() : false));

  const stateText = task.status === "completed_late"
    ? "TERLAMBAT"
    : isDone
    ? "SELESAI"
    : isOverdue
    ? "TERLAMBAT"
    : (PRIORITY_DISPLAY[task.priority ?? ""] ?? "ONGOING");

  let accentColor: string = colors.primaryContainer;
  if (isDone) accentColor = colors.success;

  const stateColor = task.status === "completed_late"
    ? { bg: colors.errorSoft, text: colors.errorStrong }
    : isDone
    ? DONE_COLOR
    : isOverdue
    ? { bg: colors.errorSoft, text: colors.errorStrong }
    : (PRIORITY_COLOR[task.priority ?? ""] ?? { bg: colors.errorSoft, text: colors.errorStrong });

  return {
    id: task.id,
    itemType: "task",
    accentColor,
    stateText,
    stateColor,
    deadline: deadline || "—",
    title: task.task_name,
    description: task.deskripsi ?? "",
    category: task.tag?.nama_tag ?? "—",
    showCategoryTag: task.id_tag !== null,
    status: isDone ? "done" : "open",
    rawStatus: task.status,
    progress: task.progress / 100,
  };
}

function activityToListItem(activity: Activity): ListItem {
  const datePart = formatActivityDate(activity.tanggal);
  const timeParts = [activity.time_start, activity.time_end]
    .filter(Boolean)
    .map((t) => fromApiTime(t));
  const deadline = [datePart, timeParts.join("-")].filter(Boolean).join(" | ");

  const isDone = activity.status === "completed" || activity.status === "cancelled";

  let stateText: string;
  if (activity.status === "cancelled") stateText = "DIBATALKAN";
  else if (isDone) stateText = "SELESAI";
  else if (activity.ulangi) stateText = ULANGI_DISPLAY[activity.ulangi];
  else stateText = activity.tag?.nama_tag?.toUpperCase() ?? "AKTIF";

  let accentColor: string = colors.primaryContainer;
  if (activity.status === "cancelled") accentColor = colors.error;
  else if (isDone) accentColor = colors.success;

  const stateColor: StateColor = isDone
    ? activity.status === "cancelled"
      ? { bg: colors.errorSoft, text: colors.errorStrong }
      : DONE_COLOR
    : { bg: colors.surfaceWarm, text: colors.warning };

  return {
    id: activity.id,
    itemType: "activity",
    accentColor,
    stateText,
    stateColor,
    deadline: deadline || "—",
    title: activity.activity_name,
    description: activity.deskripsi ?? "",
    category: activity.tag?.nama_tag ?? "—",
    showCategoryTag: activity.id_tag !== null,
    status: isDone ? "done" : "open",
    rawStatus: activity.status ?? "not_started",
    progress: activity.progress / 100,
  };
}

function formatActivityDate(value: string | null): string {
  if (!value) return "";
  const normalized = value.trim();
  const dateOnly = normalized.split("T")[0] ?? normalized;
  const isoMatch = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  let day: string, month: string, year: string;

  if (isoMatch) [, year, month, day] = isoMatch;
  else if (slashMatch) [, day, month, year] = slashMatch;
  else return normalized;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return `${Number(day)} ${monthNames[Number(month) - 1] ?? month} ${year}`;
}

function renderListContent(
  isLoading: boolean,
  isError: boolean,
  active: Tab,
  visibleItems: ListItem[],
  onPressItem: (item: ListItem) => void,
  activeMenuId: string | null,
  setActiveMenuId: (id: string | null) => void,
  onDeleteRequest: (id: string, type: "task" | "activity") => void,
) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Gagal memuat data. Coba lagi.</Text>
      </View>
    );
  }
  if (visibleItems.length === 0) {
    const msg = active === "tugas" ? "Belum ada tugas." : "Belum ada aktivitas.";
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{msg}</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {visibleItems.map((item) => (
        <Pressable key={item.id} onPress={() => onPressItem(item)} style={styles.clickableCard}>
          <TaskCard 
            {...item} 
            isMenuOpen={activeMenuId === item.id}
            onToggleMenu={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
            onDelete={() => onDeleteRequest(item.id, item.itemType)}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function ListPage() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();

  const [active, setActive] = useState<Tab>("tugas");
  const [activeFilters, setActiveFilters] = useState<string[]>(["Semua"]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useTasksQuery();
  const { data: activities = [], isLoading: activitiesLoading, isError: activitiesError } = useActivitiesQuery();
  
  const deleteActivityMutation = useDeleteActivityMutation();

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setActiveMenuId(null);

      if (tabParam === "aktivitas") setActive("aktivitas");
      else setActive("tugas");
      setActiveFilters(["Semua"]);
    }, [queryClient, tabParam]),
  );

  const isLoading = active === "tugas" ? tasksLoading : activitiesLoading;
  const isError = active === "tugas" ? tasksError : activitiesError;

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    const aDone = isTaskDone(a.status) ? 1 : 0;
    const bDone = isTaskDone(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aKey = `${a.date ?? "9999-12-31"}T${a.time ?? "23:59:59"}`;
    const bKey = `${b.date ?? "9999-12-31"}T${b.time ?? "23:59:59"}`;
    return aDone === 1 ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey);
  }), [tasks]);

  const sortedActivities = useMemo(() => [...activities].sort((a, b) => {
    const aDone = a.status === "completed" || a.status === "cancelled" ? 1 : 0;
    const bDone = b.status === "completed" || b.status === "cancelled" ? 1 : 0; 
    if (aDone !== bDone) return aDone - bDone;
    const aKey = `${a.tanggal ?? "9999-12-31"}T${a.time_start ?? "23:59:59"}`;
    const bKey = `${b.tanggal ?? "9999-12-31"}T${b.time_start ?? "23:59:59"}`;
    return aKey.localeCompare(bKey);
  }), [activities]);

  const items = active === "tugas" ? sortedTasks.map(taskToListItem) : sortedActivities.map(activityToListItem);

  const dynamicFilterOptions = useMemo(() => {
    const baseStatusFilters = active === "tugas"
        ? ["Semua", "Berlangsung", "Selesai"]
        : ["Semua", "Belum Mulai", "Berlangsung", "Selesai"];

    const uniqueTags = new Set<string>();
    items.forEach((item) => {
      if (item.showCategoryTag && item.category && item.category !== "—") {
        uniqueTags.add(item.category);
      }
    });
    return [...baseStatusFilters, ...Array.from(uniqueTags)];
  }, [items, active]);

  React.useEffect(() => {
    const validSelections = activeFilters.filter((f) => dynamicFilterOptions.includes(f));
    if (validSelections.length === 0) setActiveFilters(["Semua"]);
    else if (validSelections.length < activeFilters.length) setActiveFilters(validSelections);
  }, [active, dynamicFilterOptions]);

  const handleFilterPress = (filter: string) => {
    setActiveMenuId(null);
    if (filter === "Semua") {
      setActiveFilters(["Semua"]);
      return;
    }
    let nextFilters = activeFilters.filter((f) => f !== "Semua");
    if (nextFilters.includes(filter)) {
      nextFilters = nextFilters.filter((f) => f !== filter);
      if (nextFilters.length === 0) nextFilters = ["Semua"];
    } else {
      nextFilters.push(filter);
    }
    setActiveFilters(nextFilters);
  };

  const handleDeleteRequest = (id: string, type: "task" | "activity") => {
    if (type === "task") {
      if (Platform.OS === "web") {
        window.alert("Fitur hapus tugas akan segera datang setelah file backend siap.");
      } else {
        Alert.alert("Info", "Fitur hapus tugas akan segera datang setelah file backend siap.");
      }
      setActiveMenuId(null);
      return;
    }

    // Dynamic Multiplatform alert fallback verification logic
    if (Platform.OS === "web") {
      const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus aktivitas ini?");
      if (confirmDelete) {
        deleteActivityMutation.mutate(id, {
          onSuccess: () => {
            setActiveMenuId(null);
            window.alert("Aktivitas berhasil dihapus.");
          },
          onError: (error) => {
            console.error(error);
            window.alert("Gagal menghapus aktivitas. Silakan coba lagi.");
          }
        });
      }
    } else {
      Alert.alert(
        "Hapus Aktivitas",
        "Apakah Anda yakin ingin menghapus aktivitas ini?",
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus", 
            style: "destructive", 
            onPress: () => {
              deleteActivityMutation.mutate(id, {
                onSuccess: () => {
                  setActiveMenuId(null);
                  Alert.alert("Sukses", "Aktivitas berhasil dihapus.");
                },
                onError: (error) => {
                  console.error(error);
                  Alert.alert("Error", "Gagal menghapus aktivitas. Silakan coba lagi.");
                }
              });
            } 
          }
        ]
      );
    }
  };

  const visibleItems = items.filter((item) => {
    if (activeFilters.includes("Semua")) return true;
    const targetStatuses = activeFilters.filter((f) => ["Belum Mulai", "Berlangsung", "Selesai"].includes(f));
    const targetTags = activeFilters.filter((f) => !["Belum Mulai", "Berlangsung", "Selesai"].includes(f));

    let statusMatch = targetStatuses.length === 0;
    if (!statusMatch) {
      statusMatch = targetStatuses.some((statusFilter) => {
        if (statusFilter === "Selesai") return item.status === "done";
        if (statusFilter === "Berlangsung") {
          return item.itemType === "task"
            ? item.rawStatus === "ongoing"
            : item.rawStatus === "ongoing" || item.rawStatus === "pending";
        }
        if (statusFilter === "Belum Mulai") return item.itemType === "activity" && item.rawStatus === "not_started";
        return false;
      });
    }

    let tagMatch = targetTags.length === 0;
    if (!tagMatch) tagMatch = targetTags.includes(item.category);
    return statusMatch && tagMatch;
  });

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      {activeMenuId !== null && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveMenuId(null)} />
      )}

      <View style={styles.headerRow}>
        <Pressable onPress={() => goBackOr("/")} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.title}>List</Text>
        <Pressable style={styles.iconButton} accessibilityRole="button" onPress={() => router.push("/search")}>
          <Ionicons name="search" size={22} color={colors.primaryContainer} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActive("tugas"); setActiveMenuId(null); }}
          style={[styles.tabButton, active === "tugas" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, active === "tugas" && styles.tabLabelActive]}>Tugas</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActive("aktivitas"); setActiveMenuId(null); }}
          style={[styles.tabButton, active === "aktivitas" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, active === "aktivitas" && styles.tabLabelActive]}>Aktivitas</Text>
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {dynamicFilterOptions.map((f) => {
            const isSelected = activeFilters.includes(f);
            return (
              <Pressable
                key={f}
                onPress={() => handleFilterPress(f)}
                style={[styles.chip, isSelected ? styles.chipActive : null]}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, isSelected ? styles.chipTextActive : null]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {renderListContent(
        isLoading, 
        isError, 
        active, 
        visibleItems, 
        (item) => {
          if (active === "tugas") {
            router.push({ pathname: "/taskprogress", params: { id: item.id, tab: "tugas" } });
          } else {
            router.push({ pathname: "/activityprogress", params: { id: item.id, tab: "aktivitas" } });
          }
        },
        activeMenuId,
        setActiveMenuId,
        handleDeleteRequest
      )}
    </View>
  );
}

interface TaskCardProps extends ListItem {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
}

function TaskCard({
  itemType = "task",
  accentColor = colors.error,
  stateText = "TINGGI",
  stateColor = { bg: colors.errorSoft, text: colors.errorStrong },
  deadline = "30 April 2026 | 18.00",
  title = "—",
  description = "",
  category = "—",
  showCategoryTag = false,
  status = "open",
  progress = 0,
  isMenuOpen,
  onToggleMenu,
  onDelete,
}: Readonly<TaskCardProps>) {
  const isActivity = itemType === "activity";
  const deadlineIconName = isActivity ? "calendar-outline" : status === "done" ? "checkmark-circle-outline" : "warning-outline";
  const deadlineIconColor = isActivity ? colors.iconMuted : status === "done" ? colors.success : colors.error;
  const deadlineTextStyle = isActivity ? styles.deadlineTextActivity : status === "done" ? styles.deadlineTextDone : styles.deadlineText;

  return (
    <View style={[styles.taskCard, status === "done" && styles.taskCardDone]}>
      <View style={[styles.taskAccent, { backgroundColor: accentColor }]} />
      <View style={styles.taskHeaderRow}>
        <View style={[styles.deadlineRow, isActivity && styles.deadlineRowActivity]}>
          <Ionicons name={deadlineIconName} size={14} color={deadlineIconColor} />
          <Text style={deadlineTextStyle}>{deadline}</Text>
        </View>
        
        <View style={styles.menuContainer}>
          <Pressable 
            hitSlop={12} 
            style={styles.menuTrigger}
            onPress={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.iconMuted} />
          </Pressable>

          {isMenuOpen && (
            <Pressable 
              style={styles.deleteDropdown} 
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={14} color={colors.errorStrong} />
              <Text style={styles.deleteDropdownText}>Hapus</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.taskMainRow}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, status === "done" && styles.taskTitleDone]}>{title}</Text>
          {description ? (
            <Text style={[styles.taskDescription, status === "done" && styles.taskDescriptionDone]}>
              {description}
            </Text>
          ) : null}

          <View style={styles.tagRow}>
            {stateText === "TERLAMBAT" || stateText === "DIBATALKAN" ? (
              <View style={[styles.tag, { backgroundColor: colors.errorSoft }]}>
                <Text style={[styles.priorityTagText, { color: colors.errorStrong }]}>{stateText}</Text>
              </View>
            ) : status !== "done" ? (
              <View style={[styles.tag, { backgroundColor: stateColor.bg }]}>
                <Text style={[styles.priorityTagText, { color: stateColor.text }]}>{stateText}</Text>
              </View>
            ) : null}
            {showCategoryTag ? (
              <View style={[styles.tag, styles.categoryTag]}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.progressWrap}>
          {status === "done" ? (
            <View
              style={[
                styles.doneCircle,
                {
                  borderColor: stateText === "DIBATALKAN" ? colors.error : colors.success,
                  backgroundColor: stateText === "DIBATALKAN" ? colors.errorSoft : colors.surfaceSuccess,
                },
              ]}
            >
              <Ionicons
                name={stateText === "DIBATALKAN" ? "close" : "checkmark"}
                size={18}
                color={stateText === "DIBATALKAN" ? colors.error : colors.success}
              />
            </View>
          ) : (
            <ProgressRing progress={progress} size={56} strokeWidth={5} />
          )}
        </View>
      </View>
    </View>
  );
}

function ProgressRing({
  progress,
  size,
  strokeWidth,
}: Readonly<{ progress: number; size: number; strokeWidth: number }>) {
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
  },
  iconButton: { 
    width: 36, 
    height: 36, 
    alignItems: "center", 
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" } }) 
  },
  title: { fontSize: typography.h2.fontSize, fontFamily: fonts["900"], color: colors.onSurface },
  tabRow: {
    flexDirection: "row",
    gap: 60,
    paddingHorizontal: 18,
    paddingTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: "transparent",
    ...Platform.select({ web: { cursor: "pointer" } })
  },
  tabButtonActive: { borderBottomColor: colors.primaryContainer },
  tabLabel: { color: colors.iconMuted, fontFamily: fonts["700"], fontSize: 15 },
  tabLabelActive: { color: colors.primaryContainer, fontFamily: fonts["900"] },
  filterContainer: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  filterScrollContent: {
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    ...Platform.select({ web: { cursor: "pointer", userSelect: "none" } })
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurfaceVariant, fontFamily: fonts["700"] },
  chipTextActive: { color: colors.onPrimary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 14, fontFamily: fonts["500"], color: colors.iconMuted, textAlign: "center" },
  content: { padding: 16, paddingBottom: 120 },
  clickableCard: {
    ...Platform.select({ web: { cursor: "pointer" } })
  },
  taskCard: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  taskCardDone: {
    opacity: 0.86,
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
  },
  taskAccent: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  taskHeaderRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 8,
    zIndex: 5 
  },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deadlineText: { color: colors.error, fontFamily: fonts["700"], fontSize: 12 },
  deadlineTextDone: { color: colors.onSurfaceVariant },
  deadlineRowActivity: { gap: 5 },
  deadlineTextActivity: { color: colors.onSurfaceVariant, fontFamily: fonts["500"], fontSize: 13 },
  taskMainRow: { flexDirection: "row", alignItems: "center", gap: 12, zIndex: 1 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, lineHeight: 20, color: colors.onSurface, fontFamily: fonts["900"] },
  taskTitleDone: { color: colors.onSurfaceVariant },
  taskDescription: { marginTop: 6, fontSize: 13, fontFamily: fonts["400"], color: colors.tertiary },
  taskDescriptionDone: { color: colors.iconMuted },
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
    top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: { color: colors.primaryContainer, fontSize: 12, fontFamily: fonts["800"] },
  doneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
  },
  menuContainer: { position: "relative" },
  menuTrigger: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: -8,
    ...Platform.select({ web: { cursor: "pointer" } })
  },
  deleteDropdown: {
    position: "absolute",
    right: 0,
    top: 24,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 99,
    minWidth: 100,
    ...Platform.select({ web: { cursor: "pointer" } })
  },
  deleteDropdownText: { color: colors.errorStrong, fontFamily: fonts["700"], fontSize: 14 },
});