import { colors, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

export default function App() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const bottomBarHeight = 78;
  const fabBottom = bottomBarHeight + 12;
  const [overlayOpen, setOverlayOpen] = useState(false);
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const actionOneProgress = React.useRef(new Animated.Value(0)).current;
  const actionTwoProgress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (overlayOpen) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.stagger(70, [
          Animated.timing(actionOneProgress, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(actionTwoProgress, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      return;
    }

    backdropOpacity.setValue(0);
    actionOneProgress.setValue(0);
    actionTwoProgress.setValue(0);
  }, [actionOneProgress, actionTwoProgress, backdropOpacity, overlayOpen]);

  function toggleOverlay(): void {
    setOverlayOpen((current) => !current);
  }

  function closeOverlay(): void {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(actionOneProgress, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(actionTwoProgress, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setOverlayOpen(false);
      }
    });
  }

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image
                  source={require("../../assets/images/react-logo.png")}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            <View style={styles.greetingBlock}>
              <Text style={styles.greetingTitle}>Halo, Mahasiswa</Text>
              <Text style={styles.greetingSubtitle}>Semangat mengerjakan tugasmu!</Text>
            </View>

            <Pressable style={styles.bellButton} accessibilityRole="button">
              <Ionicons name="notifications-outline" size={28} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tugas Saya</Text>

        <View style={styles.summaryRow}>
          <SummaryCard
            accent={colors.primaryContainer}
            icon="time-outline"
            title="Belum Dikerjakan"
            value="10"
            background={colors.surfaceWarm}
          />
          <SummaryCard
            accent={colors.success}
            icon="checkmark-circle"
            title="Selesai"
            value="5"
            background={colors.surfaceSuccess}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tugas Aktif</Text>
          <Text style={styles.sectionCaption}>Diurutkan berdasarkan tenggat waktu</Text>
        </View>

        <View style={styles.taskCard}>
          <View style={styles.taskAccent} />
          <View style={styles.taskHeaderRow}>
            <View style={styles.deadlineRow}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={styles.deadlineText}>30 April 2026 | 18.00</Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.iconMuted} />
          </View>

          <View style={styles.taskMainRow}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Wireframe MAD</Text>
              <Text style={styles.taskDescription}>Final review untuk project Dueday App</Text>

              <View style={styles.tagRow}>
                <View style={[styles.tag, styles.priorityTag]}>
                  <Text style={styles.priorityTagText}>TINGGI</Text>
                </View>
                <View style={[styles.tag, styles.categoryTag]}>
                  <Text style={styles.categoryTagText}>Kuliah</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressWrap}>
                <ProgressRing progress={0.5} size={64} strokeWidth={6} />
            </View>
          </View>
        </View>

        <Pressable style={styles.actionButton} accessibilityRole="button" onPress={() => router.push('/list')}>
          <Text style={styles.actionButtonText}>Lihat List Aktivitas/Tugas</Text>
        </Pressable>

        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <View style={styles.reminderIconWrap}>
              <Ionicons name="notifications-outline" size={18} color={colors.primaryContainer} />
            </View>
            <Text style={styles.reminderText}>Pengingat Saya</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.iconSubtle} />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={overlayOpen}
        statusBarTranslucent
        onRequestClose={closeOverlay}
      >
        <View style={styles.overlayRoot}>
          <Pressable style={styles.overlayBackdrop} onPress={closeOverlay} />

          <View style={[styles.overlayActions, { bottom: fabBottom + 64 }]}>
            <OverlayActionButton
              progress={actionOneProgress}
              icon="document-text-outline"
              label="Buat Tugas"
              onPress={closeOverlay}
            />
            <OverlayActionButton
              progress={actionTwoProgress}
              icon="flash-outline"
              label="Buat Aktivitas"
              onPress={closeOverlay}
            />
          </View>
        </View>
      </Modal>

      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        accessibilityRole="button"
        accessibilityLabel={overlayOpen ? "Close quick actions" : "Add new task"}
        onPress={toggleOverlay}
      >
        <Ionicons name={overlayOpen ? "close" : "add"} size={32} color={colors.surfaceContainerLowest} />
      </Pressable>
    </View>
  );
}

type OverlayActionButtonProps = {
  progress: Animated.Value;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
};

function OverlayActionButton({ progress, icon, label, onPress }: Readonly<OverlayActionButtonProps>) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const opacity = progress;

  return (
    <Animated.View style={[styles.overlayActionRow, { opacity, transform: [{ translateY }] }]}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.overlayActionButton}>
        <View style={styles.overlayActionLabelWrap}>
          <Text style={styles.overlayActionLabel}>{label}</Text>
        </View>
        <View style={styles.overlayActionIconWrap}>
          <Ionicons name={icon} size={18} color={colors.onPrimary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

type SummaryCardProps = {
  accent: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
  background: string;
};

function SummaryCard({ accent, icon, title, value, background }: Readonly<SummaryCardProps>) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: background }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={16} color={colors.onPrimary} />
      </View>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

type ProgressRingProps = {
  progress: number;
  size: number;
  strokeWidth: number;
};

function ProgressRing({ progress, size, strokeWidth }: Readonly<ProgressRingProps>) {
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 22,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  greetingBlock: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: 24,
    fontWeight: typography.h3.fontWeight,
    color: colors.onSurface,
  },
  greetingSubtitle: {
    marginTop: 2,
    fontSize: typography.bodySm.fontSize,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: 28,
    fontWeight: typography.h2.fontWeight,
    color: colors.primaryContainer,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.surfaceContainerLowest,
  },
  summaryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: typography.bodyLg.fontSize,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    fontWeight: typography.labelBold.fontWeight,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: typography.bodySm.fontSize,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  taskCard: {
    position: "relative",
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    paddingLeft: 16,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
  },
  taskAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: colors.error,
  },
  taskHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deadlineText: {
    color: colors.error,
    fontWeight: "700",
    fontSize: 13,
  },
  taskMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.onSurface,
    fontWeight: "900",
  },
  taskDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.tertiary,
    fontWeight: "500",
  },
  tagRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityTag: {
    backgroundColor: colors.errorSoft,
  },
  categoryTag: {
    backgroundColor: colors.primaryContainer,
  },
  priorityTagText: {
    color: colors.errorStrong,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  categoryTagText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  progressWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: colors.primaryContainer,
    fontSize: 12,
    fontWeight: "800",
  },
  actionButton: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  actionButtonText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontWeight: "800",
  },
  reminderCard: {
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderText: {
    fontSize: 15,
    color: colors.onSurface,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.inverseSurface,
    opacity: 0.72,
  },
  overlayActions: {
    position: "absolute",
    right: 27, // align action icons above FAB center (FAB right:20, FAB width 56, action icon width 42)
    gap: 12,
    flexDirection: "column-reverse", // stack actions upwards from the FAB
    bottom: 100, // raise actions so they don't overlap the FAB; adjust if needed
  },
  overlayActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  overlayActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  overlayActionLabelWrap: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.inverseSurface,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayActionLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  overlayActionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
});