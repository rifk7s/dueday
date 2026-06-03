import { fromApiDate, fromApiTime } from "@/api/format";
import { type Task } from "@/api/tasks";
import { type Activity, type UlangiType } from "@/api/activities";
import { colors, fonts, typography } from "@/constants/theme";
import { badgeLabel } from "@/lib/taskLabels";
import { useActivitiesQuery, useDeleteActivityMutation } from "@/hooks/useActivities";
import { useTasksQuery, useDeleteTaskMutation } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { goBackOr } from "@/constants/navigation";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
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
  stateKey?: string;
  stateColor?: StateColor;
  deadline?: string;
  title?: string;
  description?: string;
  category: string;
  showCategoryTag: boolean;
  status: "open" | "done";
  rawStatus: string;
  progress?: number;
  isElearnSource?: boolean;
};

const PRIORITY_COLOR: Record<string, StateColor> = {
  high: { bg: colors.errorSoft, text: colors.errorStrong },
  medium: { bg: colors.surfaceWarm, text: colors.warning },
  low: { bg: colors.surfaceSuccess, text: colors.success },
};

const DEFAULT_PRIORITY_COLOR: StateColor = { bg: colors.surfaceWarm, text: colors.warning };
const DONE_COLOR: StateColor = { bg: colors.surfaceContainerLow, text: colors.onSurfaceVariant };

function isTaskDone(status: Task["status"]): boolean {
  return status === "completed" || status === "completed_late";
}

function taskToListItem(task: Task, t: TFunction): ListItem {
  const datePart = fromApiDate(task.date);
  const timePart = task.time ? fromApiTime(task.time) : "";
  const deadline = [datePart, timePart].filter(Boolean).join(" | ");
  const isDone = isTaskDone(task.status);

  const isElearnSource = task.source?.toLowerCase() === "elearn";
  const isOverdue = !isDone && (task.is_overdue ?? (task.date ? new Date((task.date ?? "") + " " + (task.time ?? "00:00:00")) < new Date() : false));

  // Safeguard case sensitivity from database string updates
  const normalizedPriority = (task.priority ?? "").toLowerCase().trim();

  // Stable key so comparisons in TaskCard stay locale-independent; translated at render.
  const stateKey = task.status === "completed_late"
    ? "late"
    : isDone
    ? "done"
    : isOverdue
    ? "late"
    : (normalizedPriority === "high" || normalizedPriority === "medium" || normalizedPriority === "low" ? normalizedPriority : "ongoing");
  const stateText = badgeLabel(stateKey, t);

  let accentColor: string = colors.primaryContainer;
  if (isDone) accentColor = colors.success;

  const stateColor = task.status === "completed_late"
    ? { bg: colors.errorSoft, text: colors.errorStrong }
    : isDone
    ? DONE_COLOR
    : isOverdue
    ? { bg: colors.errorSoft, text: colors.errorStrong }
    : (PRIORITY_COLOR[normalizedPriority] ?? DEFAULT_PRIORITY_COLOR);

  return {
    id: task.id,
    itemType: "task",
    accentColor,
    stateText,
    stateKey,
    stateColor,
    deadline: deadline || "—",
    title: task.task_name,
    description: task.deskripsi ?? "",
    category: isElearnSource ? "ELEARN" : (task.tag?.nama_tag ?? "—"),
    showCategoryTag: isElearnSource || task.id_tag !== null,
    status: isDone ? "done" : "open",
    rawStatus: task.status,
    progress: task.progress / 100,
    isElearnSource,
  };
}

function activityToListItem(activity: Activity, t: TFunction): ListItem {
  const datePart = formatActivityDate(activity.tanggal);
  const timeParts = [activity.time_start, activity.time_end]
    .filter(Boolean)
    .map((time) => fromApiTime(time));
  const deadline = [datePart, timeParts.join("-")].filter(Boolean).join(" | ");

  const isDone = activity.status === "completed" || activity.status === "cancelled";

  let stateKey: string;
  let stateText: string;
  if (activity.status === "cancelled") {
    stateKey = "cancelled";
    stateText = badgeLabel("cancelled", t);
  } else if (isDone) {
    stateKey = "done";
    stateText = badgeLabel("done", t);
  } else if (activity.ulangi) {
    stateKey = "repeat";
    stateText = repeatBadgeText(activity.ulangi, t);
  } else if (activity.tag?.nama_tag) {
    stateKey = "tag";
    stateText = activity.tag.nama_tag.toUpperCase();
  } else {
    stateKey = "active";
    stateText = t("list.activeBadge");
  }

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
    stateKey,
    stateColor,
    deadline: deadline || "—",
    title: activity.activity_name,
    description: activity.deskripsi ?? "",
    category: activity.tag?.nama_tag ?? "—",
    showCategoryTag: activity.id_tag !== null,
    status: isDone ? "done" : "open",
    rawStatus: activity.status ?? "not_started",
    progress: activity.progress / 100,
    isElearnSource: false,
  };
}

function repeatBadgeText(ulangi: UlangiType, t: TFunction): string {
  switch (ulangi) {
    case "setiap_hari":
      return t("common.repeatBadgeDaily");
    case "satu_minggu":
      return t("common.repeatBadgeWeekly");
    case "satu_bulan":
      return t("common.repeatBadgeMonthly");
    case "satu_tahun":
      return t("common.repeatBadgeYearly");
  }
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
  t: TFunction,
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
        <Text style={styles.emptyText}>{t("list.loadFailed")}</Text>
      </View>
    );
  }
  if (visibleItems.length === 0) {
    const msg = active === "tugas" ? t("list.emptyTasks") : t("list.emptyActivities");
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{msg}</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {visibleItems.map((item) => {
        const isMenuOpen = activeMenuId === item.id;
        return (
          <Pressable 
            key={item.id} 
            onPress={() => onPressItem(item)} 
            style={[styles.clickableCard, { zIndex: isMenuOpen ? 100 : 1 }]}
          >
            <TaskCard 
              {...item} 
              isMenuOpen={isMenuOpen}
              onToggleMenu={() => setActiveMenuId(isMenuOpen ? null : item.id)}
              onDelete={() => onDeleteRequest(item.id, item.itemType)}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Translate the status filter chips while keeping their Indonesian values as the
// stable filter keys the logic compares against. Tag names pass through untranslated.
function filterLabel(value: string, t: TFunction): string {
  switch (value) {
    case "Semua":
      return t("list.filterAll");
    case "Belum Mulai":
      return t("list.filterNotStarted");
    case "Berlangsung":
      return t("list.filterOngoing");
    case "Selesai":
      return t("list.filterDone");
    default:
      return value;
  }
}

export default function ListPage() {
  const { t } = useTranslation();
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
  const deleteTaskMutation = useDeleteTaskMutation(); 

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

  const items = active === "tugas"
    ? sortedTasks.map((task) => taskToListItem(task, t))
    : sortedActivities.map((activity) => activityToListItem(activity, t));

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

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleDeleteRequest = (id: string, type: "task" | "activity") => {
    const isTask = type === "task";
    const title = isTask ? t("home.deleteTaskTitle") : t("activityProgress.deleteTitle");
    const message = isTask
      ? t("home.deleteTaskConfirm")
      : t("activityProgress.deleteConfirm");

    const runMutation = () => {
      if (isTask) {
        deleteTaskMutation.mutate(id, {
          onSuccess: () => {
            setActiveMenuId(null);
            showAlert(t("home.successTitle"), t("home.deleteTaskSuccess"));
          },
          onError: (error) => {
            console.error(error);
            showAlert(t("common.error"), t("home.deleteTaskFailed"));
          }
        });
      } else {
        deleteActivityMutation.mutate(id, {
          onSuccess: () => {
            setActiveMenuId(null);
            showAlert(t("home.successTitle"), t("activityProgress.deleteSuccess"));
          },
          onError: (error) => {
            console.error(error);
            showAlert(t("common.error"), t("activityProgress.deleteFailed"));
          }
        });
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        runMutation();
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.delete"), style: "destructive", onPress: runMutation }
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
        <Text style={styles.title}>{t("list.title")}</Text>
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
          <Text style={[styles.tabLabel, active === "tugas" && styles.tabLabelActive]}>{t("common.task")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActive("aktivitas"); setActiveMenuId(null); }}
          style={[styles.tabButton, active === "aktivitas" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, active === "aktivitas" && styles.tabLabelActive]}>{t("common.activity")}</Text>
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
                <Text style={[styles.chipText, isSelected ? styles.chipTextActive : null]}>{filterLabel(f, t)}</Text>
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
        handleDeleteRequest,
        t
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
  stateText = "",
  stateKey = "ongoing",
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
  isElearnSource = false,
}: Readonly<TaskCardProps>) {
  const { t } = useTranslation();
  const isActivity = itemType === "activity";
  const deadlineIconName = isActivity ? "calendar-outline" : status === "done" ? "checkmark-circle-outline" : "warning-outline";
  const deadlineIconColor = isActivity ? colors.iconMuted : status === "done" ? colors.success : colors.error;
  const deadlineTextStyle = isActivity ? styles.deadlineTextActivity : status === "done" ? styles.deadlineTextDone : styles.deadlineText;

  const shouldRenderPriorityTag = stateKey !== "late" && stateKey !== "cancelled";

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
              <Text style={styles.deleteDropdownText}>{t("common.delete")}</Text>
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
            {stateKey === "late" || stateKey === "cancelled" ? (
              <View style={[styles.tag, { backgroundColor: colors.errorSoft }]}>
                <Text style={[styles.priorityTagText, { color: colors.errorStrong }]}>{stateText}</Text>
              </View>
            ) : status !== "done" && shouldRenderPriorityTag ? (
              <View style={[styles.tag, { backgroundColor: stateColor.bg }]}>
                <Text style={[styles.priorityTagText, { color: stateColor.text }]}>{stateText}</Text>
              </View>
            ) : null}
            
            {showCategoryTag ? (
              <View style={[styles.tag, isElearnSource ? styles.elearnTag : styles.categoryTag]}>
                <Text style={styles.categoryTagText} numberOfLines={1}>{category}</Text>
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
                  borderColor: stateKey === "cancelled" ? colors.error : colors.success,
                  backgroundColor: stateKey === "cancelled" ? colors.errorSoft : colors.surfaceSuccess,
                },
              ]}
            >
              <Ionicons
                name={stateKey === "cancelled" ? "close" : "checkmark"}
                size={18}
                color={stateKey === "cancelled" ? colors.error : colors.success}
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
    position: "relative",
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
  tagRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tag: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  priorityTag: { backgroundColor: colors.errorSoft },
  doneTag: { backgroundColor: colors.surfaceSuccess },
  categoryTag: { backgroundColor: colors.primaryContainer },
  elearnTag: { backgroundColor: colors.elearn },
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
    zIndex: 999,
    minWidth: 100,
    ...Platform.select({ web: { cursor: "pointer" } })
  },
  deleteDropdownText: { 
    color: colors.errorStrong, 
    fontFamily: fonts["700"], 
    fontSize: 14 
  }
});
