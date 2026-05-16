import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivityQuery, useUpdateActivityMutation } from "@/hooks/useActivities";
import type { Activity, UlangiType } from "@/api/activities";
import Svg, { Circle } from "react-native-svg";

type ActivityProgressParams = {
  id?: string;
  tab?: string;
};

export default function ActivityProgressScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { id, tab } = useLocalSearchParams<ActivityProgressParams>();
  
  const { data: activity, isLoading, error } = useActivityQuery(id);
  const updateActivityMutation = useUpdateActivityMutation();
  const [activityState, setActivityState] = useState<Activity["status"]>("not_started");

  useEffect(() => {
    if (activity?.status) {
      setActivityState(activity.status);
    }
  }, [activity?.status]);

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={[styles.screen, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load activity</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace({ pathname: "/list", params: { tab: "aktivitas" } })}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const progressPercentage = activityState === "completed" ? 100 : activity?.progress ?? 0;
  const ringColor = progressPercentage === 0 ? colors.progressTrack : colors.primaryContainer;
  const accentColor = colors.primaryContainer;
  
  const startHour = activity.time_start ? formatClock(activity.time_start) : "08.00";
  const endHour = activity.time_end ? formatClock(activity.time_end) : "09.00";
  const activityDate = activity.tanggal ? formatDateLabel(activity.tanggal) : "-";
  const repeatText = activity.ulangi ? formatRepeat(activity.ulangi) : "Tidak Ada";

  const updateStatus = (nextStatus: Activity["status"]) => {
    if (!id) return;

    setActivityState(nextStatus);
    updateActivityMutation.mutate({
      id,
      data: { status: nextStatus },
    });
  };

  const handleStart = () => {
    updateStatus("ongoing");
  };

  const handlePause = () => {
    updateStatus("pending");
  };

  const handleResume = () => {
    updateStatus("ongoing");
  };

  const handleComplete = () => {
    updateStatus("completed");
  };

  const handleCancel = () => {
    updateStatus("not_started");
  };

  const renderStepActions = () => {
    if (activityState === "not_started") {
      return (
        <>
          <Pressable style={styles.primaryButton} onPress={handleStart}>
            <Text style={styles.primaryButtonText}>Mulai</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Ubah Jadwal</Text>
          </Pressable>

          <Pressable style={styles.ghostButton} onPress={handleCancel}>
            <Text style={styles.ghostButtonText}>Batalkan</Text>
          </Pressable>
        </>
      );
    }

    if (activityState === "ongoing") {
      return (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionHalfButton} onPress={handlePause}>
            <Text style={styles.secondaryButtonText}>Jeda</Text>
          </Pressable>

          <Pressable style={styles.actionHalfButtonPrimary} onPress={handleComplete}>
            <Text style={styles.primaryButtonText}>Selesai</Text>
          </Pressable>
        </View>
      );
    }

    if (activityState === "pending") {
      return (
        <>
          <Pressable style={styles.primaryButton} onPress={handleResume}>
            <Text style={styles.primaryButtonText}>Lanjutkan</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleComplete}>
            <Text style={styles.secondaryButtonText}>Selesai</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Ubah Jadwal</Text>
          </Pressable>

          <Pressable style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Batalkan</Text>
          </Pressable>
        </>
      );
    }

    return (
      <View style={styles.completeMessage}>
        <Ionicons name="checkmark-circle" size={48} color={ringColor} />
        <Text style={styles.completeText}>Aktivitas Selesai!</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { marginTop: top + 8 }]}>
        <Pressable onPress={() => router.replace({ pathname: "/list", params: { tab: "aktivitas" } })} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Activity Progress</Text>
        <Pressable hitSlop={12}>
          <Ionicons name="create-outline" size={24} color={colors.primaryContainer} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      >
        <CardView
          title={activity.activity_name}
          startHour={startHour}
          endHour={endHour}
          progress={progressPercentage}
          ringColor={ringColor}
          accentColor={accentColor}
          isComplete={activityState === "completed"}
        >
          {renderStepActions()}
        </CardView>

        <SectionLabel label="WAKTU" />
        <View style={styles.chipRow}>
          <InfoChip label={`Mulai: ${startHour}`} tone="warm" />
          <InfoChip label={`Selesai: ${endHour}`} tone="warm" />
        </View>

        <SectionLabel label="TANGGAL" />
        <View style={styles.singleChipRow}>
          <InfoChip label={activityDate} tone="cool" />
        </View>

        {activity.deskripsi && (
          <>
            <SectionLabel label="DESKRIPSI" />
            <Text style={styles.description}>{activity.deskripsi}</Text>
          </>
        )}

        {activity.tag && (
          <>
            <SectionLabel label="TAG" />
            <View style={styles.singleChipRow}>
              <InfoChip label={activity.tag.nama_tag} tone="outline" />
            </View>
          </>
        )}

        {activity.ulangi && (
          <>
            <SectionLabel label="PENGULANGAN" />
            <Text style={styles.repeatText}>{repeatText}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CardView({
  title,
  startHour,
  endHour,
  progress,
  ringColor,
  accentColor,
  isComplete,
  children,
}: Readonly<{
  title: string;
  startHour: string;
  endHour: string;
  progress: number;
  ringColor: string;
  accentColor: string;
  isComplete?: boolean;
  children?: React.ReactNode;
}>) {
  return (
    <View style={styles.card}>
      <Text style={styles.activityTitle}>{title}</Text>

      <ProgressRing progress={progress} ringColor={ringColor} textColor={accentColor} />

      {children}
    </View>
  );
}

function ProgressRing({
  progress,
  ringColor,
  textColor,
}: Readonly<{
  progress: number;
  ringColor: string;
  textColor: string;
}>) {
  const size = 116;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={styles.progressRingWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
          />
        ) : null}
      </Svg>
      <View style={styles.progressRingInner}>
        <Text style={[styles.progressValue, { color: textColor }]}>{Math.round(clamped)}%</Text>
      </View>
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
  if (!value) return value;
  const parts = value.split(":");
  const hour = parts[0] ?? "";
  const minute = parts[1] ?? "00";
  const hourNum = Number(hour);
  if (Number.isNaN(hourNum)) return value;
  const h = hourNum.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}.${m}`;
}

function formatDateLabel(value: string): string {
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

function formatRepeat(ulangi: UlangiType): string {
  const repeatMap: Record<UlangiType, string> = {
    setiap_hari: "Setiap Hari",
    satu_minggu: "Setiap Minggu",
    satu_bulan: "Setiap Bulan",
    satu_tahun: "Setiap Tahun",
  };
  return repeatMap[ulangi] ?? "Tidak Ada";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  errorText: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: fonts["500"],
    color: colors.error,
    marginBottom: 16,
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
  activityTitle: {
    textAlign: "center",
    fontSize: 17,
    fontFamily: fonts["600"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  progressRingWrap: {
    position: "relative",
    width: 116,
    height: 116,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  progressRingInner: {
    position: "absolute",
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionHalfButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    backgroundColor: colors.surfaceContainerLowest,
  },
  actionHalfButtonPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
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
  toggleButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toggleButtonText: {
    color: colors.onPrimary,
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
  },
  completeMessage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  completeText: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
  },
});
