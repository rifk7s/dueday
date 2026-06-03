import DatePickerCalendar from "@/components/DatePickerModal";
import TimePicker from "@/components/TimePickerModal";
import { colors, fonts } from "@/constants/theme";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { useUpdateTaskMutation } from "@/hooks/useTasks";
import TagSelector from "@/components/TagSelector";
import type { Tag } from "@/api/tags";
import { fromApiTime, toApiDate, toApiTime } from "@/api/format";
import { PRIORITY_API_MAP, type UpdateTask } from "@/api/tasks";
import { priorityOptionLabel } from "@/lib/taskLabels";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useTasksQuery } from "@/hooks/useTasks";

type PriorityType = "Tinggi" | "Sedang" | "Rendah" | null;

function isoToDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return "";
  const ymd = iso.substring(0, 10);
  const [yyyy, mm, dd] = ymd.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

const PRIORITY_API_TO_UI: Record<string, PriorityType> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export default function EditTaskPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useGradualAnimation();
  const scrollRef = useRef<React.ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const prevGoalsHeight = useRef(0);
  const isGoalsFocused = useRef(false);
  const prevDescHeight = useRef(0);
  const isDescFocused = useRef(false);
  const [footerHeight, setFooterHeight] = useState(80);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tasks = [], isLoading, isError } = useTasksQuery();
  const task = tasks.find((t) => t.id === id);

  // Check if the current task source is synchronized from Elearn
  const isElearnTask = task?.source?.toLowerCase() === "elearn";

  const [namatugas, setNamaTugas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [prioritas, setPrioritas] = useState<PriorityType>(null);
  const [tag, setTag] = useState<Tag | null>(null);
  const [goals, setGoals] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [validationError, setValidationError] = useState("");

  const updateMutation = useUpdateTaskMutation();
  const isKeyboardVisible = useKeyboardState((s) => s.isVisible);

  useEffect(() => {
    if (task) {
      setNamaTugas(task.task_name ?? "");
      setTanggal(isoToDdMmYyyy(task.date ?? ""));
      setJam(fromApiTime(task.time));
      setPrioritas(PRIORITY_API_TO_UI[task.priority ?? ""] ?? null);
      setTag(task.tag ?? null);
      setGoals(task.goals ?? "");
      setDeskripsi(task.deskripsi ?? "");
    }
  }, [task]);

  const getPriorityColor = (priority: PriorityType) => {
    if (priority === "Tinggi") return colors.error;
    if (priority === "Sedang") return colors.primaryContainer;
    if (priority === "Rendah") return colors.success;
    return colors.surfaceContainerLow;
  };

  const handleSave = () => {
    if (!task) return;

    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    if (!namatugas.trim()) {
      setValidationError(t("createTask.nameRequired"));
      return;
    }
    if (!tanggal) {
      setValidationError(t("createTask.deadlineRequired"));
      return;
    }
    setValidationError("");

    // Package payload safely using standard object construction
    let updatePayload: UpdateTask;

    if (isElearnTask) {
      updatePayload = {
        // If prioritas is cleared/null, use undefined to match type restrictions
        priority: prioritas ? PRIORITY_API_MAP[prioritas] : undefined,
      };
    } else {
      updatePayload = {
        task_name: namatugas.trim() || undefined,
        date: tanggal ? toApiDate(tanggal) : undefined,
        // Use undefined instead of null to fix the time type mismatch error
        time: jam ? toApiTime(jam) : undefined,
        priority: prioritas ? PRIORITY_API_MAP[prioritas] : undefined,
        id_tag: tag?.id_tag ?? undefined, // Swapped to undefined just in case
        goals: goals.trim() || undefined,
        deskripsi: deskripsi.trim() || undefined,
      };
    }

    // Run mutation safely with clean types
    updateMutation.mutate(
      {
        id: task.id,
        data: updatePayload,
      },
      {
        onSuccess: () => {
          if (Platform.OS === "android") {
            ToastAndroid.show(t("editTask.editedSuccess"), ToastAndroid.SHORT);
          } else {
            Alert.alert(t("common.success"), t("editTask.editedSuccess"));
          }
          router.back();
        },
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

  if (isError || !task) {
    return (
      <View style={[styles.centered, { paddingTop: top }]}>
        <Text style={styles.emptyText}>{t("editTask.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>{t("common.back")}</Text>
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
        <Text style={styles.headerTitle}>{t("editTask.title")}</Text>
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
        {validationError ? (
          <Text style={styles.errorText}>{validationError}</Text>
        ) : null}
        {updateMutation.isError ? (
          <Text style={styles.errorText}>
            {updateMutation.error instanceof Error ? updateMutation.error.message : t("editTask.saveChangesFailed")}
          </Text>
        ) : null}

        {isElearnTask && (
          <View style={styles.elearnNotice}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primaryContainer} />
            <Text style={styles.elearnNoticeText}>
              {t("editTask.elearnNotice")}
            </Text>
          </View>
        )}

        <View style={[styles.section, isElearnTask && styles.disabledSection]}>
          <Text style={styles.label}>{t("createTask.taskNameLabel")}</Text>
          <TextInput
            style={[styles.input, isElearnTask && styles.disabledInput]}
            placeholder={t("createTask.taskNamePlaceholder")}
            placeholderTextColor={colors.iconMuted}
            value={namatugas}
            onChangeText={setNamaTugas}
            editable={!isElearnTask}
          />
        </View>

        <View style={[styles.section, isElearnTask && styles.disabledSection]}>
          <Text style={styles.label}>{t("createTask.deadlineLabel")}</Text>
          <Pressable
            style={[styles.dateTimeContainer, isElearnTask && styles.disabledInput]}
            onPress={() => !isElearnTask && setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={isElearnTask ? colors.iconMuted : colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !tanggal && styles.dateTimePlaceholder, isElearnTask && styles.disabledText]}>
              {tanggal || t("createTask.pickDate")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.dateTimeContainer, isElearnTask && styles.disabledInput]}
            onPress={() => !isElearnTask && setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={isElearnTask ? colors.iconMuted : colors.primaryContainer} style={styles.dateIcon} />
            <Text style={[styles.dateTimeText, !jam && styles.dateTimePlaceholder, isElearnTask && styles.disabledText]}>
              {jam || t("createTask.pickTime")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t("createTask.priorityLabel")}</Text>
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
                  <Text style={[styles.chipText, { color: isSelected ? colors.onPrimary : priorityColor }]}>
                    {priorityOptionLabel(priority, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={isElearnTask && styles.disabledSection}>
          <TagSelector 
            selectedTag={tag} 
            onSelectTag={isElearnTask ? () => {} : setTag} 
          />
        </View>

        <View style={[styles.section, isElearnTask && styles.disabledSection]}>
          <Text style={styles.label}>{t("createTask.goalsLabel")}</Text>
          <TextInput
            style={[styles.input, styles.goalsInput, isElearnTask && styles.disabledInput]}
            placeholder={t("createTask.goalsPlaceholder")}
            placeholderTextColor={colors.iconMuted}
            value={goals}
            onChangeText={setGoals}
            multiline
            textAlignVertical="top"
            editable={!isElearnTask}
            onFocus={() => {
              isGoalsFocused.current = true;
            }}
            onBlur={() => {
              isGoalsFocused.current = false;
            }}
            onContentSizeChange={(e) => {
              const newHeight = e.nativeEvent.contentSize.height;
              if (isGoalsFocused.current && newHeight > prevGoalsHeight.current) {
                scrollRef.current?.scrollToEnd?.({ animated: true });
              }
              prevGoalsHeight.current = newHeight;
            }}
          />
        </View>

        <View style={[styles.section, isElearnTask && styles.disabledSection]}>
          <Text style={styles.label}>{t("createTask.descriptionLabel")}</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput, isElearnTask && styles.disabledInput]}
            placeholder={t("createTask.descriptionPlaceholder")}
            placeholderTextColor={colors.iconMuted}
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            textAlignVertical="top"
            editable={!isElearnTask}
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
            <Text style={styles.saveButtonText}>{t("editTask.saveChanges")}</Text>
          )}
        </Pressable>
      </Animated.View>

      <DatePickerCalendar
        visible={!isElearnTask && showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={setTanggal}
        selectedDate={tanggal}
      />
      <TimePicker
        visible={!isElearnTask && showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={setJam}
        selectedTime={jam}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonIcon: { 
    padding: 8, 
    marginLeft: -8 
  },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: fonts["600"], 
    color: colors.onBackground, 
    flex: 1, 
    textAlign: "center" 
  },
  headerSpacer: { 
    width: 44 
  },
  container: { 
    flex: 1 
  },
  content: { 
    paddingHorizontal: 16, 
    paddingTop: 20 
  },
  elearnNotice: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  elearnNoticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  errorText: { 
    fontSize: 13, 
    fontFamily: fonts["500"], 
    color: colors.error, 
    marginBottom: 16, 
    paddingHorizontal: 4 
  },
  section: { 
    marginBottom: 24 
  },
  disabledSection: {
    opacity: 0.65,
  },
  label: { 
    fontSize: 14, 
    fontFamily: fonts["600"], 
    color: colors.primaryContainer, 
    marginBottom: 10 
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerLow, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 14, 
    fontFamily: fonts["400"], 
    color: colors.onSurface, 
    backgroundColor: colors.surfaceContainerLowest 
  },
  disabledInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.surfaceContainerLow,
  },
  disabledText: {
    color: colors.iconMuted,
  },
  goalsInput: { 
    minHeight: 120, 
    paddingTop: 12 
  },
  descriptionInput: { 
    minHeight: 100, 
    paddingTop: 12 
  },
  dateTimeContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerLow, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    backgroundColor: colors.surfaceContainerLowest, 
    marginBottom: 12 
  },
  dateIcon: { 
    marginRight: 8 
  },
  dateTimeText: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: 14, 
    fontFamily: fonts["400"], 
    color: colors.onSurface 
  },
  dateTimePlaceholder: { 
    color: colors.iconMuted 
  },
  chipRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 999, 
    marginBottom: 8 
  },
  chipText: { 
    fontSize: 13, 
    fontFamily: fonts["500"] 
  },
  footer: { 
    position: "absolute", 
    left: 0, 
    right: 0, 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    backgroundColor: colors.background, 
    borderTopWidth: 1, 
    borderTopColor: colors.surfaceContainerLow 
  },
  saveButton: { 
    backgroundColor: colors.primaryContainer, 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 999, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  saveButtonDisabled: { 
    opacity: 0.6 
  },
  saveButtonText: { 
    fontSize: 16, 
    fontFamily: fonts["600"], 
    color: colors.onPrimary 
  },
  centered: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 24, 
    backgroundColor: colors.surfaceContainerLowest 
  },
  emptyText: { 
    fontSize: 14, 
    fontFamily: fonts["500"], 
    color: colors.onSurfaceVariant, 
    textAlign: "center", 
    marginBottom: 12 
  },
  backLink: { 
    paddingVertical: 8, 
    paddingHorizontal: 16 
  },
  backLinkText: { 
    color: colors.primaryContainer, 
    fontFamily: fonts["700"], 
    fontSize: 14 
  },
});
