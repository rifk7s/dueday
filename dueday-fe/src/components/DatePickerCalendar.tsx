import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DatePickerCalendarProps = {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  focusDate?: string;
  inline?: boolean;
  markedDays?: string[];
};

export default function DatePickerCalendar({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  focusDate,
  inline = false,
  markedDays = [],
}: Readonly<DatePickerCalendarProps>) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [tempSelectedDate, setTempSelectedDate] = useState<string | undefined>(selectedDate);
  const hasAutoFocusedMarkedMonth = useRef(false);

  useEffect(() => {
    if (visible) {
      setTempSelectedDate(selectedDate);
    }
  }, [visible, selectedDate]);

  useEffect(() => {
    if (!inline || hasAutoFocusedMarkedMonth.current) {
      return;
    }

    const targetDate = focusDate ?? markedDays.find((day) => day.includes("-")) ?? markedDays[0];
    if (!targetDate) return;

    const [year, month] = targetDate.split("-");
    const nextMonth = Number(month) - 1;
    const nextYear = Number(year);

    if (Number.isFinite(nextMonth) && Number.isFinite(nextYear)) {
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
      hasAutoFocusedMarkedMonth.current = true;
    }
  }, [focusDate, inline, markedDays]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${day.toString().padStart(2, "0")}/${(currentMonth + 1).toString().padStart(2, "0")}/${currentYear}`;
    setTempSelectedDate(dateStr);
    if (inline) {
      onDateSelect(dateStr);
    }
  };

  const handleConfirm = () => {
    if (tempSelectedDate) onDateSelect(tempSelectedDate);
    setTempSelectedDate(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate);
    onClose();
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const isSelectedDate = (day: number) => {
    if (!tempSelectedDate) return false;
    const parts = tempSelectedDate.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return parseInt(d) === day && parseInt(m) === currentMonth + 1 && parseInt(y) === currentYear;
    }
    return false;
  };

  const getMarkerCount = (day: number) => {
    const fullDateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const dayKey = day.toString().padStart(2, "0");
    return markedDays.filter((markedDay) => markedDay === fullDateKey || markedDay === dayKey).length;
  };

  const calendarContent = (
    <View
      style={[
        styles.content,
        inline && styles.inlineContent,
        !inline && {
          maxHeight: windowHeight * 0.88,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      {!inline ? (
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Pilih Tanggal</Text>
          <View style={{ width: 24 }} />
        </View>
      ) : null}

      <View style={[styles.monthNav, inline && styles.inlineMonthNav]}>
        <Pressable onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={inline ? 20 : 24} color={colors.primaryContainer} />
        </Pressable>
        <Text style={[styles.monthText, inline && styles.inlineMonthText]}>{monthNames[currentMonth]} {currentYear}</Text>
        <Pressable onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={inline ? 20 : 24} color={colors.primaryContainer} />
        </Pressable>
      </View>

      <View style={[styles.dayHeaderRow, inline && styles.inlineDayHeaderRow]}>
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, idx) => (
          <Text key={idx} style={[styles.dayHeaderText, inline && styles.inlineDayHeaderText]}>{day}</Text>
        ))}
      </View>

      <View style={[styles.calendarGrid, inline && styles.inlineCalendarGrid]}>
        {calendarDays.map((day, idx) => (
          <View key={idx} style={[styles.dayCell, inline && styles.inlineDayCell]}>
            {day ? (
              <Pressable
                style={[
                  styles.dayButton,
                  inline && styles.inlineDayButton,
                  isToday(day) && styles.todayButton,
                  isSelectedDate(day) && styles.selectedButton,
                ]}
                onPress={() => handleDateSelect(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    inline && styles.inlineDayText,
                    (isToday(day) || isSelectedDate(day)) && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
                {getMarkerCount(day) > 0 ? (
                  <View style={styles.markerDotsRow}>
                    {Array.from({ length: Math.min(getMarkerCount(day), 3) }).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.markerDot,
                          isSelectedDate(day) && styles.markerDotActive,
                          index === 2 && getMarkerCount(day) > 2 && styles.markerDotFaded,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {!inline ? (
        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Batal</Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>OK</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (inline) {
    return calendarContent;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>{calendarContent}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  container: { justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  content: { width: "100%", maxWidth: 400, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, paddingBottom: 20 },
  inlineContent: { maxWidth: "100%", width: "100%", borderRadius: 24, paddingBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow },
  headerTitle: { fontSize: 18, fontFamily: fonts["600"], color: colors.onSurface },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  inlineMonthNav: { paddingHorizontal: 14, paddingVertical: 10 },
  monthText: { fontSize: 16, fontFamily: fonts["600"], color: colors.onSurface },
  inlineMonthText: { fontSize: 14 },
  dayHeaderRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  inlineDayHeaderRow: { paddingHorizontal: 14, marginBottom: 6 },
  dayHeaderText: { flex: 1, textAlign: "center", fontSize: 12, fontFamily: fonts["600"], color: colors.onSurfaceVariant },
  inlineDayHeaderText: { fontSize: 11 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginBottom: 16 },
  inlineCalendarGrid: { paddingHorizontal: 14, marginBottom: 12 },
  dayCell: { width: "14.28%", height: 48, justifyContent: "center", alignItems: "center" },
  inlineDayCell: { height: 42 },
  dayButton: { width: 40, height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  inlineDayButton: { width: 36, height: 36 },
  markerDotsRow: { marginTop: 3, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
  markerDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: colors.primaryContainer },
  markerDotActive: { backgroundColor: colors.onPrimary },
  markerDotFaded: { opacity: 0.4 },
  todayButton: { backgroundColor: colors.surfaceContainerLow },
  selectedButton: { backgroundColor: colors.primaryContainer },
  dayText: { fontSize: 14, fontFamily: fonts["500"], color: colors.onSurface },
  inlineDayText: { fontSize: 13 },
  dayTextActive: { color: colors.onPrimary },
  footer: { flexShrink: 0, flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 8 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceContainerLow, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: fonts["600"], color: colors.onSurface },
  confirmButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.primaryContainer, alignItems: "center" },
  confirmText: { fontSize: 14, fontFamily: fonts["600"], color: colors.onPrimary },
  
});
