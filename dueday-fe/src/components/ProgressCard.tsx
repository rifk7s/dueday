import { colors, fonts, typography } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type ProgressCardProps = {
  title: string;
  progress: number;
  onUpdatePress?: () => void;
};

const RING_SIZE = 140;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressCard({ title, progress, onUpdatePress }: Readonly<ProgressCardProps>) {
  const clamped = Math.max(0, Math.min(100, progress));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.ringWrapper}>
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={styles.ringSvg}
        >
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.progressTrack}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.primaryContainer}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            fill="none"
          />
        </Svg>
        <View style={styles.ringLabel} pointerEvents="none">
          <Text style={styles.percentText}>{Math.round(clamped)}%</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={onUpdatePress}>
        <Text style={styles.buttonText}>Update progress</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts["600"],
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 16,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  ringSvg: {
    transform: [{ rotate: "-90deg" }],
  },
  ringLabel: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 28,
    fontFamily: fonts["700"],
    color: colors.primaryContainer,
  },
  button: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: typography.button.fontSize,
    fontFamily: typography.button.fontFamily,
  },
});
