import { updateActivity } from "@/api/activities";
import { getPendingPaymentTransferParams } from "@/api/payments";
import { updateTask } from "@/api/tasks";
import { updateMe } from "@/api/users";
import type { AuthUser } from "@/auth/api";
import { useSession } from "@/auth/ctx";
import { setStorageItemAsync } from "@/auth/useStorageState";
import { colors, fonts, typography } from "@/constants/theme";
import { useBottomBarSpace } from "@/hooks/useBottomBarSpace";
import { useTasksQuery } from "@/hooks/useTasks";
import { FontAwesome5, Ionicons } from "@expo/vector-icons"; // 👑 Added FontAwesome5 for the crown icons
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { user, signOut, token, setUser } = useSession();
  const [displayNickname, setDisplayNickname] = useState(user?.nickname ?? user?.name ?? "—");
  const [signingOut, setSigningOut] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(user?.nickname ?? "");
  const router = useRouter();
  const MOCK_AUTH = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

  const isPremium = String(user?.status) === "subscribed";

  React.useEffect(() => {
    setDisplayNickname(user?.nickname ?? user?.name ?? "—");
    setNicknameInput(user?.nickname ?? "");
  }, [user?.nickname, user?.name]);

  const queryClientRef = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (nick: string) => updateMe({ nickname: nick }, token ?? null),
    onSuccess: async (updatedUser: AuthUser) => {
      setEditingNickname(false);
      setDisplayNickname(updatedUser.nickname ?? displayNickname);
      setNicknameInput(updatedUser.nickname ?? "");

      await setStorageItemAsync("auth_user", JSON.stringify(updatedUser));

      try {
        setUser?.(updatedUser);
      } catch (e) {
        // ignore
      }

      try {
        queryClientRef.setQueryData(["me"], updatedUser);
        queryClientRef.setQueryData(["current-user"], updatedUser);
        queryClientRef.invalidateQueries({ queryKey: ["activities"] });
        queryClientRef.invalidateQueries({ queryKey: ["tasks"] });
        queryClientRef.invalidateQueries({ queryKey: ["current-user"] });
      } catch (e) {
        // ignore
      }

      if (Platform.OS === "android") {
        ToastAndroid.show("Nickname berhasil disimpan", ToastAndroid.SHORT);
      } else {
        Alert.alert("Berhasil", "Nickname berhasil disimpan");
      }
    },
    onError: (err) => {
      if (Platform.OS === "android") {
        ToastAndroid.show("Gagal menyimpan nickname", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Gagal menyimpan nickname");
      }
    },
    onSettled: () => {},
  });

  const performLogout = async () => {
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

  const handleLogout = () => {
    if (signingOut) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmLogout = window.confirm("Yakin ingin keluar dari akun ini?");
      if (confirmLogout) {
        void performLogout();
      }
      return;
    }

    Alert.alert(
      "Logout",
      "Yakin ingin keluar dari akun ini?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => void performLogout() },
      ],
      { cancelable: true },
    );
  };

  const handleUpgradeToPremium = async (): Promise<void> => {
    if (!token || MOCK_AUTH) {
      router.push("/premium-plan");
      return;
    }

    try {
      const pendingPayment = await getPendingPaymentTransferParams(token);

      if (pendingPayment) {
        router.push({
          pathname: "/detail-transfer",
          params: pendingPayment,
        });
        return;
      }
    } catch {
      // Fall back
    }

    router.push("/premium-plan");
  };

  const settingsWithActions = settings.map((item) =>
    item.label === "Upgrade to Premium"
      ? { ...item, onPress: () => void handleUpgradeToPremium() }
      : item
  );

  // Developer-only setup
  if (MOCK_AUTH && user) {
    settingsWithActions.push({
      icon: "sparkles-outline",
      label: isPremium ? "Unset Premium (Dev)" : "Set Premium (Dev)",
      onPress: async () => {
        try {
          const newStatus: "subscribed" | "unsubscribed" = isPremium ? "unsubscribed" : "subscribed";
          const updatedUser: AuthUser = { ...user, status: newStatus };

          await setStorageItemAsync("auth_user", JSON.stringify(updatedUser));

          try {
            setUser?.(updatedUser);
          } catch (e) {
            // ignore
          }

          queryClientRef.setQueryData(["current-user"], updatedUser);

          if (newStatus === "unsubscribed") {
            try {
              const tasksCache = queryClientRef.getQueryData<any[]>(["tasks"]) ?? [];
              const activitiesCache = queryClientRef.getQueryData<any[]>(["activities"]) ?? [];

              queryClientRef.setQueryData(["tasks"], tasksCache.map((t) => ({
                ...t,
                reminder_style: null,
                reminder_sound: null,
                reminder_frequency: null,
                reminder_vibrate: null,
              })));

              queryClientRef.setQueryData(["activities"], activitiesCache.map((a) => ({
                ...a,
                reminder_style: null,
                reminder_sound: null,
                reminder_frequency: null,
                reminder_vibrate: null,
              })));

              const taskPromises = tasksCache.map((t) => {
                if (t?.reminder_style || t?.reminder_sound || t?.reminder_frequency || t?.reminder_vibrate) {
                  return updateTask(t.id, {
                    reminder_style: null,
                    reminder_sound: null,
                    reminder_frequency: null,
                    reminder_vibrate: null,
                  }, token ?? null).catch(() => null);
                }
                return Promise.resolve(null);
              });

              const activityPromises = activitiesCache.map((a) => {
                if (a?.reminder_style || a?.reminder_sound || a?.reminder_frequency || a?.reminder_vibrate) {
                  return updateActivity(a.id, {
                    reminder_style: null,
                    reminder_sound: null,
                    reminder_frequency: null,
                    reminder_vibrate: null,
                  }, token ?? null).catch(() => null);
                }
                return Promise.resolve(null);
              });

              await Promise.all([...taskPromises, ...activityPromises]);

              queryClientRef.invalidateQueries({ queryKey: ["tasks"] });
              queryClientRef.invalidateQueries({ queryKey: ["activities"] });
            } catch (e) {
              // ignore
            }
          } else {
            queryClientRef.invalidateQueries({ queryKey: ["activities"] });
            queryClientRef.invalidateQueries({ queryKey: ["tasks"] });
          }

          queryClientRef.invalidateQueries({ queryKey: ["current-user"] });

          const msg = newStatus === "subscribed" ? "User set to Subscribed (dev)" : "User set to Unsubscribed (dev)";
          if (Platform.OS === "android") {
            ToastAndroid.show(msg, ToastAndroid.SHORT);
          } else {
            Alert.alert("Dev", msg);
          }
        } catch (err) {
          if (Platform.OS === "android") {
            ToastAndroid.show("Gagal mengubah status dev", ToastAndroid.SHORT);
          } else {
            Alert.alert("Error", "Gagal mengubah status dev");
          }
        }
      },
    });
  }

  const { data: tasks = [] } = useTasksQuery();

  const selesai = tasks.filter((t) => t.status === "completed" || t.status === "completed_late").length;
  const berlangsung = tasks.filter((t) => t.status === "ongoing").length;

  const completedLate = tasks.filter((t) => t.status === "completed_late").length;
  const ongoingLate = tasks.filter((t) => {
    if (t.status !== "ongoing") return false;
    const isOverdue = t.is_overdue ?? (t.date ? new Date((t.date ?? "") + " " + (t.time ?? "00:00:00")) < new Date() : false);
    return isOverdue;
  }).length;

  const terlambat = completedLate + ongoingLate;

  const taskStats: TaskStat[] = [
    { label: "Selesai", value: String(selesai), color: colors.success },
    { label: "Berlangsung", value: String(berlangsung), color: colors.warning },
    { label: "Terlambat", value: String(terlambat), color: colors.errorStrong },
  ];

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

            {/* 👑 Dynamic Profile Pic Badge: Shows a Crown if Premium, Camera if normal */}
            <View style={[styles.avatarBadge, isPremium && { backgroundColor: "#D48C2A" }]}>
              {isPremium ? (
                <FontAwesome5 name="crown" size={10} color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={12} color={colors.onPrimary} />
              )}
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{displayNickname}</Text>
            <Pressable style={styles.editNicknameButton} onPress={() => setEditingNickname(true)}>
              <Ionicons name="pencil" size={16} color={colors.primaryContainer} />
            </Pressable>
          </View>
          <Text style={styles.profileRole}>{user?.name ?? "—"}</Text>
          {user?.nim ? <Text style={styles.profileMeta}>NIM: {user.nim}</Text> : null}
          <Text style={styles.profileMeta}>{user?.email ?? "—"}</Text>

          {/* 👑 Guaranteed Premium Badge with FontAwesome5 Crown */}
          {isPremium && (
            <View style={styles.premiumBadgeContainer}>
              <FontAwesome5 name="crown" size={12} color="#784A1A" style={{ marginRight: 6 }} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengaturan</Text>
          </View>

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
      
      {editingNickname ? (
        <View style={styles.modalBackdrop} pointerEvents="box-none">
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Nickname</Text>
            <TextInput
              style={styles.input}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="Nickname"
              autoCapitalize="words"
            />
            <View style={styles.modalActionRow}>
              <Pressable style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]} onPress={() => setEditingNickname(false)}>
                <Text style={styles.secondaryButtonText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => updateMutation.mutate(nicknameInput)}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.primaryButtonText}>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
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
    borderColor: colors.surfaceContainerLowest,
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
    padding: 16,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editNicknameButton: {
    marginLeft: 8,
  },
  modalBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts["600"],
    color: colors.onSurface,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 12,
  },
  modalActionRow: {
    flexDirection: "row",
    marginTop: 8,
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
  premiumBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF3E7", 
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 74, 26, 0.1)", 
  },
  premiumBadgeText: {
    color: "#784A1A", 
    fontSize: 15,
    fontFamily: fonts["700"] ?? "System", 
  },
});