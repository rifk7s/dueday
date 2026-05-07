import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DayChip = {
  day: string;
  date: string;
  active?: boolean;
};

type ScheduleItem = {
  id: string;
  startHour: number;
  endHour: number;
  title: string;
  color: string;
  accent: string;
};

const dayChips: DayChip[] = [
  { day: "Min", date: "28" },
  { day: "Sen", date: "29" },
  { day: "Sel", date: "30", active: true },
  { day: "Rab", date: "1" },
  { day: "Kam", date: "2" },
];

const scheduleItems: ScheduleItem[] = [
  {
    id: "morning-workout",
    startHour: 8,
    endHour: 9,
    title: "Olahraga Pagi",
    color: "#efe2b8",
    accent: "#e0a400",
  },
  {
    id: "english",
    startHour: 12,
    endHour: 13,
    title: "Bahasa Inggris",
    color: "#b4e4de",
    accent: "#23b5a6",
  },
  {
    id: "history",
    startHour: 14,
    endHour: 15,
    title: "Sejarah",
    color: "#d0cce8",
    accent: "#8f54dd",
  },
];

const START_HOUR = 8;
const END_HOUR = 15;
const SLOT_HEIGHT = 72;
const timelineHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

export default function CalendarScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Jadwal</Text>
          <Ionicons name="search-outline" size={22} color={colors.primaryContainer} />
        </View>

        <View style={styles.monthRow}>
          <Ionicons name="chevron-back" size={10} color={colors.onSurface} />
          <Text style={styles.monthTitle}>April</Text>
          <Ionicons name="chevron-forward" size={10} color={colors.onSurface} />
        </View>

        <View style={styles.dayStrip}>
          {dayChips.map((chip) => (
            <View key={`${chip.day}-${chip.date}`} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{chip.day}</Text>
              <View style={[styles.dateChip, chip.active ? styles.dateChipActive : styles.dateChipInactive]}>
                <Text style={[styles.dateText, chip.active ? styles.dateTextActive : styles.dateTextInactive]}>
                  {chip.date}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>

        <View style={styles.scheduleContainer}>
          <View
            style={[
              styles.dashedLine,
              {
                top: (11 - START_HOUR) * SLOT_HEIGHT + SLOT_HEIGHT / 2,
              },
            ]}
          />

          <View style={styles.hoursColumn}>
            {timelineHours.map((hour) => {
              const dashed = hour === 11;
              return (
                <View key={hour} style={styles.hourRow}>
                  {dashed ? (
                    <View style={styles.dashedRow}>
                      <View style={styles.dashedDot} />
                      <Text style={styles.hourText}>{formatHour(hour)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.hourText}>{formatHour(hour)}</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.cardsColumn}>
            <View style={styles.cardsLayer}>
              {scheduleItems.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ScheduleCard({ item }: Readonly<{ item: ScheduleItem }>) {
  const top = (item.startHour - START_HOUR) * SLOT_HEIGHT + 24;
  const height = (item.endHour - item.startHour) * SLOT_HEIGHT + 28;

  return (
    <View style={[styles.scheduleCard, { backgroundColor: item.color, top, height }]}>
      <View style={[styles.scheduleAccent, { backgroundColor: item.accent }]} />
      <Text style={styles.scheduleTitle}>{item.title}</Text>
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
        <Text style={styles.timeText}>{`${formatHour(item.startHour)} - ${formatHour(item.endHour)}`}</Text>
      </View>
      <View style={styles.avatarRow}>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <View style={[styles.avatarMini, styles.avatarOffset]}>
          <Text style={styles.avatarText}>R</Text>
        </View>
        <View style={[styles.avatarMini, styles.avatarOffset]}>
          <Text style={styles.avatarText}>I</Text>
        </View>
      </View>
    </View>
  );
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}.00`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingBottom: 120,
  },
  headerRow: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 22,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  monthRow: {
    height: 58,
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  dayStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dayItem: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  dateChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dateChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  dateChipInactive: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
  },
  dateText: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["700"],
  },
  dateTextActive: {
    color: colors.onPrimary,
  },
  dateTextInactive: {
    color: colors.onSurface,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 14,
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.primaryContainer,
  },
  scheduleContainer: {
    position: "relative",
    flexDirection: "row",
    paddingHorizontal: 14,
  },
  hoursColumn: {
    width: 56,
  },
  hourRow: {
    height: SLOT_HEIGHT,
    justifyContent: "center",
  },
  hourText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  dashedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dashedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
  },
  cardsColumn: {
    flex: 1,
    paddingLeft: 6,
  },
  cardsLayer: {
    position: "relative",
    height: timelineHours.length * SLOT_HEIGHT,
  },
  dashedLine: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 0,
    borderTopWidth: 1,
    borderTopColor: colors.primaryContainer,
    borderStyle: "dashed",
  },
  scheduleCard: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: "hidden",
  },
  scheduleAccent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 2,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: fonts["800"],
    color: colors.onSurface,
  },
  timeRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: fonts["600"],
    color: colors.onSurfaceVariant,
  },
  avatarRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#4ea5c0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceContainerLowest,
  },
  avatarOffset: {
    marginLeft: -4,
  },
  avatarText: {
    fontSize: 9,
    fontFamily: fonts["700"],
    color: colors.surfaceContainerLowest,
  },
});
