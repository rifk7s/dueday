import { useSession } from "@/auth/ctx";
import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomBarSpace } from "@/hooks/useBottomBarSpace";

type TaskStat = {
  label: string;
  value: string;
  color: string;
};

type SettingItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  accent?: string;
  onPress?: () => void;
};

const taskStats: TaskStat[] = [
  { label: "Selesai", value: "17", color: colors.success },
  { label: "Berlangsung", value: "3", color: colors.warning },
  { label: "Terlambat", value: "1", color: colors.errorStrong },
];

const settings: SettingItem[] = [
  {
    icon: "globe-outline",
    label: "Bahasa",
    value: "Indonesia",
  },
  {
    icon: "moon-outline",
    label: "Tema",
    value: "Terang",
  },
  {
    icon: "star-outline",
    label: "Upgrade to Premium",
    accent: colors.primaryContainer,
  },
];

export default function ProfileScreen(): React.JSX.Element {
  const { top } = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const { user, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const settingsWithActions = settings.map((item) =>
    item.label === "Upgrade to Premium"
      ? { ...item, onPress: () => router.push("/premium-plan") }
      : item
  );

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarSpace + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.headerIconButton} accessibilityRole="button">
            <Ionicons name="menu-outline" size={24} color={colors.onSurface} />
          </Pressable>

          <Text style={styles.headerTitle}>Profil</Text>

          <Pressable style={styles.headerIconButton} accessibilityRole="button">
            <Ionicons name="create-outline" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Image
                source={require("../../../assets/images/react-logo.png")}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color={colors.onPrimary} />
            </View>
          </View>

          <Text style={styles.profileName}>{user?.nickname ?? user?.name ?? user?.username ?? "—"}</Text>
          <Text style={styles.profileRole}>{user?.name ?? "—"}</Text>
          {user?.nim ? <Text style={styles.profileMeta}>NIM: {user.nim}</Text> : null}
          <Text style={styles.profileMeta}>{user?.email ?? "—"}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistik Tugas</Text>
          </View>

          <View style={styles.statRow}>
            {taskStats.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <View style={styles.statDivider} />}
                <StatCard item={item} />
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>

          <View style={styles.settingsList}>
            {settingsWithActions.map((item) => (
              <SettingRow key={item.label} item={item} />
            ))}
          </View>
        </View>

        <Pressable
          style={styles.logoutButton}
          accessibilityRole="button"
          onPress={handleLogout}
          disabled={signingOut}
        >
          <Text style={styles.logoutText}>
            {signingOut ? "Logging out…" : "Logout"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatCard({ item }: Readonly<{ item: TaskStat }>): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  );
}

function SettingRow({ item }: Readonly<{ item: SettingItem }>): React.JSX.Element {
  const iconColor = item.accent ?? colors.onSurfaceVariant;

  return (
    <Pressable
      style={styles.settingRow}
      accessibilityRole="button"
      onPress={item.onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconWrap}>
          <Ionicons name={item.icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
      </View>

      <View style={styles.settingRight}>
        {item.value ? <Text style={styles.settingValue}>{item.value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
      </View>
    </Pressable>
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
    paddingTop: 0,
    paddingBottom: 120,
  },
  headerRow: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  profileCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.primaryContainer,
    padding: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: colors.onSurface,
  },
  profileRole: {
    marginTop: 2,
    fontSize: typography.bodyLg.fontSize,
    color: colors.onSurfaceVariant,
    fontFamily: fonts["600"],
  },
  profileMeta: {
    marginTop: 4,
    fontSize: typography.bodySm.fontSize,
    color: colors.onSurfaceVariant,
    fontFamily: fonts["500"],
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: 24,
    fontFamily: typography.h3.fontFamily,
    color: colors.onSurface,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 10,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 30,
    fontFamily: fonts["900"],
  },
  statLabel: {
    marginTop: 6,
    fontSize: typography.bodySm.fontSize,
    color: colors.onSurfaceVariant,
    fontFamily: fonts["600"],
  },
  settingsList: {
    gap: 8,
  },
  settingRow: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  settingIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 15,
    color: colors.onSurface,
    fontFamily: fonts["700"],
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontFamily: fonts["600"],
  },
  logoutButton: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.errorStrong,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  logoutText: {
    color: colors.errorStrong,
    fontSize: 15,
    fontFamily: fonts["800"],
  },
});
