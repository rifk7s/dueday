import { fromApiDate, fromApiTime } from "@/api/format";
import { PRIORITY_DISPLAY, type Task } from "@/api/tasks";
import { ULANGI_DISPLAY, type Activity } from "@/api/activities";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useTasksQuery } from "@/hooks/useTasks";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
import Svg, { Circle } from "react-native-svg";

type Tab = "tugas" | "aktivitas";
type Filter = "Semua" | "Selesai" | "Pekerjaan" | "Rapat";

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
  progress?: number;
};

const PRIORITY_COLOR: Record<string, StateColor> = {
  high: { bg: colors.errorSoft, text: colors.errorStrong },
  medium: { bg: colors.surfaceWarm, text: colors.warning },
  low: { bg: colors.surfaceSuccess, text: colors.success },
};

const DONE_COLOR: StateColor = { bg: colors.surfaceContainerLow, text: colors.onSurfaceVariant };

const filterOptions: Filter[] = ["Semua", "Selesai", "Pekerjaan", "Rapat"];

function taskToListItem(task: Task): ListItem {
  const datePart = fromApiDate(task.date);
  const timePart = task.time ? fromApiTime(task.time) : "";
  const deadline = [datePart, timePart].filter(Boolean).join(" | ");

  const isDone = task.status === "completed";
  const stateText = isDone ? "SELESAI" : (PRIORITY_DISPLAY[task.priority ?? ""] ?? "ONGOING");

  let accentColor: string = colors.primaryContainer;
  if (isDone) accentColor = colors.success;

  const stateColor = isDone
    ? DONE_COLOR
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
    progress: task.progress / 100,
  };
}

function activityToListItem(activity: Activity): ListItem {
  const datePart = formatActivityDate(activity.tanggal);
  const timeParts = [activity.time_start, activity.time_end]
    .filter(Boolean)
    .map((t) => fromApiTime(t));
  const deadline = [datePart, timeParts.join("-")].filter(Boolean).join(" | ");

  const isDone = activity.status === "completed";

  let stateText: string;
  if (isDone) stateText = "SELESAI";
  else if (activity.ulangi) stateText = ULANGI_DISPLAY[activity.ulangi];
  else stateText = activity.tag?.nama_tag?.toUpperCase() ?? "AKTIF";

  let accentColor: string = colors.primaryContainer;
  if (isDone) accentColor = colors.success;

  const stateColor: StateColor = isDone
    ? DONE_COLOR
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
    progress: activity.progress / 100,
  };
}

function formatActivityDate(value: string | null): string {
  if (!value) return "";

  const normalized = value.trim();
  const dateOnly = normalized.split("T")[0] ?? normalized;
  const isoMatch = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  let day: string;
  let month: string;
  let year: string;

  if (isoMatch) {
    [, year, month, day] = isoMatch;
  } else if (slashMatch) {
    [, day, month, year] = slashMatch;
  } else {
    return normalized;
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

function renderListContent(
  isLoading: boolean,
  isError: boolean,
  active: Tab,
  visibleItems: ListItem[],
  onPressItem: (item: ListItem) => void,
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
    const msg =
      active === "tugas" ? "Belum ada tugas." : "Belum ada aktivitas.";
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{msg}</Text>
      </View>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {visibleItems.map((item) => (
        <Pressable key={item.id} onPress={() => onPressItem(item)}>
          <TaskCard {...item} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function ListPage() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();

  const [active, setActive] = useState<Tab>("tugas");
  const [activeFilter, setActiveFilter] = useState<Filter>("Semua");

  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } =
    useTasksQuery();
  const { data: activities = [], isLoading: activitiesLoading, isError: activitiesError } =
    useActivitiesQuery();

  useFocusEffect(
    React.useCallback(() => {
      if (tabParam === "aktivitas") {
        setActive("aktivitas");
      } else {
        setActive("tugas");
      }
      setActiveFilter("Semua");
    }, [tabParam]),
  );

  const isLoading = active === "tugas" ? tasksLoading : activitiesLoading;
  const isError = active === "tugas" ? tasksError : activitiesError;

  const sortedTasks = [...tasks].sort((a, b) => {
    const aDone = a.status === "completed" ? 1 : 0;
    const bDone = b.status === "completed" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aKey = `${a.date ?? "9999-12-31"}T${a.time ?? "23:59:59"}`;
    const bKey = `${b.date ?? "9999-12-31"}T${b.time ?? "23:59:59"}`;
    return aKey.localeCompare(bKey);
  });

  const sortedActivities = [...activities].sort((a, b) => {
    const aDone = a.status === "completed" ? 1 : 0;
    const bDone = b.status === "completed" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aKey = `${a.tanggal ?? "9999-12-31"}T${a.time_start ?? "23:59:59"}`;
    const bKey = `${b.tanggal ?? "9999-12-31"}T${b.time_start ?? "23:59:59"}`;
    return aKey.localeCompare(bKey);
  });

  const items =
    active === "tugas"
      ? sortedTasks.map(taskToListItem)
      : sortedActivities.map(activityToListItem);

  const visibleItems = items.filter((item) => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Selesai") return item.status === "done";
    return item.category === activeFilter;
  });

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
          onPress={() => setActive("tugas")}
          style={[styles.tabButton, active === "tugas" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, active === "tugas" && styles.tabLabelActive]}>
            Tugas
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActive("aktivitas")}
          style={[styles.tabButton, active === "aktivitas" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, active === "aktivitas" && styles.tabLabelActive]}>
            Aktivitas
          </Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {filterOptions.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.chip, f === activeFilter ? styles.chipActive : null]}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, f === activeFilter ? styles.chipTextActive : null]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {renderListContent(isLoading, isError, active, visibleItems, (item) => {
        if (active === "tugas") {
          router.push({ pathname: "/taskprogress", params: { id: item.id, tab: "tugas" } });
        } else {
          router.push({ pathname: "/activityprogress", params: { id: item.id, tab: "aktivitas" } });
        }
      })}
    </View>
  );
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
}: Readonly<Omit<ListItem, "id">>) {
  const isActivity = itemType === "activity";
  const deadlineIconName = isActivity
    ? "calendar-outline"
    : status === "done"
      ? "checkmark-circle-outline"
      : "warning-outline";
  const deadlineIconColor = isActivity
    ? colors.iconMuted
    : status === "done"
      ? colors.success
      : colors.error;
  const deadlineTextStyle = isActivity
    ? styles.deadlineTextActivity
    : status === "done"
      ? styles.deadlineTextDone
      : styles.deadlineText;

  return (
    <View style={[styles.taskCard, status === "done" && styles.taskCardDone]}>
      <View style={[styles.taskAccent, { backgroundColor: accentColor }]} />
      <View style={styles.taskHeaderRow}>
        <View style={[styles.deadlineRow, isActivity && styles.deadlineRowActivity]}>
          <Ionicons name={deadlineIconName} size={14} color={deadlineIconColor} />
          <Text style={deadlineTextStyle}>{deadline}</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={16} color={colors.iconMuted} />
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
            {status !== "done" ? (
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
              // Completed: show same-size ring with success color and subtle bg
              <View style={[styles.doneCircle, { borderColor: colors.success, backgroundColor: colors.surfaceSuccess }]}>
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
      {/** default: show label; can be hidden when used for completed-state ring */}
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
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: typography.h2.fontSize, fontFamily: fonts["900"], color: colors.onSurface },
  tabRow: {
    flexDirection: "row",
    gap: 60,
    paddingHorizontal: 18,
    paddingTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabButtonActive: { borderBottomColor: colors.primaryContainer },
  tabLabel: { color: colors.iconMuted, fontFamily: fonts["700"], fontSize: 15 },
  tabLabelActive: { color: colors.primaryContainer, fontFamily: fonts["900"] },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurfaceVariant, fontFamily: fonts["700"] },
  chipTextActive: { color: colors.onPrimary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 14, fontFamily: fonts["500"], color: colors.iconMuted, textAlign: "center" },
  content: { padding: 16, paddingBottom: 120 },
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
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  taskHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deadlineText: { color: colors.error, fontFamily: fonts["700"], fontSize: 12 },
  deadlineTextDone: { color: colors.onSurfaceVariant },
  deadlineRowActivity: { gap: 5 },
  deadlineTextActivity: { color: colors.onSurfaceVariant, fontFamily: fonts["500"], fontSize: 13 },
  taskMainRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
});
