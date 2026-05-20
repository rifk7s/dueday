import { fromApiDate, fromApiTime } from "@/api/format";
import { colors, fonts, typography } from "@/constants/theme";
import { useActivitiesQuery } from "@/hooks/useActivities";
import { useTasksQuery } from "@/hooks/useTasks";
import { useSession } from "@/auth/ctx";
import { usePersistentState } from "@/hooks/usePersistentState"; // Our persistent hook
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ListItem = {
  id: string;
  itemType: "task" | "activity";
  accentColor?: string;
  title?: string;
  description?: string;
  category: string;
  showCategoryTag: boolean;
  status: "open" | "done";
  rawStatus: string;
  deadline?: string;
};

const SEARCH_HISTORY_LIMIT = 8;

function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}

function updateSearchHistory(current: string[], searchTerm: string): string[] {
  const normalized = searchTerm.trim();
  if (!normalized) return current;
  // Deduplicate and insert at front, limit length
  return [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT);
}

export default function SearchPage() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Scopes history per logged-in user ID so different profiles don't cross data paths
  const searchHistoryKey = user?.id ? `search_history_${user.id}` : "search_history_guest";
  const [searchHistory, setSearchHistory] = usePersistentState<string>(searchHistoryKey, []);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesQuery();

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  // Transform and Merge pipelines
  const allItems = useMemo(() => {
    const taskItems = tasks.map((t): ListItem => {
      const isDone = t.status === "completed" || t.status === "completed_late";
      return {
        id: t.id,
        itemType: "task",
        accentColor: isDone ? colors.success : colors.primaryContainer,
        title: t.task_name,
        description: t.deskripsi ?? "",
        category: t.tag?.nama_tag ?? "—",
        showCategoryTag: t.id_tag !== null,
        status: isDone ? "done" : "open",
        rawStatus: t.status,
        deadline: [fromApiDate(t.date), t.time ? fromApiTime(t.time) : ""].filter(Boolean).join(" | ") || "—",
      };
    });

    const activityItems = activities.map((act): ListItem => {
      const isDone = act.status === "completed" || act.status === "cancelled";
      return {
        id: act.id,
        itemType: "activity",
        accentColor: act.status === "cancelled" ? colors.error : isDone ? colors.success : colors.primaryContainer,
        title: act.activity_name,
        description: act.deskripsi ?? "",
        category: act.tag?.nama_tag ?? "—",
        showCategoryTag: act.id_tag !== null,
        status: isDone ? "done" : "open",
        rawStatus: act.status ?? "not_started",
        deadline: act.tanggal ? `${fromApiDate(act.tanggal)}` : "—",
      };
    });

    return [...taskItems, ...activityItems];
  }, [tasks, activities]);

  const normalizedSearchQuery = normalizeSearchTerm(searchQuery);
  const isSearching = normalizedSearchQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return allItems.filter((item) => {
      const haystack = [item.title, item.description, item.category].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearchQuery);
    });
  }, [allItems, normalizedSearchQuery]);

  const handleSaveSearch = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    const nextHistory = updateSearchHistory(searchHistory, cleanTerm);
    setSearchHistory(nextHistory); // Saves directly to device disk storage automatically
  };

  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <View style={styles.searchHeaderRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.iconMuted} />
          <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={(e) => {
            // 1. Prevent web browsers from executing default HTML form actions
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            
            // 2. Save the search query to your local storage history
            handleSaveSearch(searchQuery);
            
            // 3. Unfocus the input field so the navigation history doesn't lock up
            searchInputRef.current?.blur();
          }}
          placeholder="Cari tugas atau aktivitas"
          placeholderTextColor={colors.iconMuted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearIconButton}>
              <Ionicons name="close-circle" size={18} color={colors.iconMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!isSearching && searchHistory.length > 0 ? (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyLabel}>Riwayat Pencarian</Text>
            <Pressable onPress={() => setSearchHistory([])}>
              <Text style={styles.clearAllText}>Hapus Semua</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScrollContent}>
            {searchHistory.map((term) => (
              <Pressable
                key={term}
                onPress={() => {
                  setSearchQuery(term);
                  handleSaveSearch(term);
                }}
                style={styles.historyChip}
              >
                <Text style={styles.historyChipText}>{term}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {isSearching ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCountText}>{searchResults.length} hasil ditemukan</Text>
          </View>

          {tasksLoading || activitiesLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primaryContainer} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {searchResults.map((item) => (
                <Pressable
                  key={`${item.itemType}-${item.id}`}
                  onPress={() => {
                    handleSaveSearch(searchQuery);
                    if (item.itemType === "task") {
                      router.push({ pathname: "/taskprogress", params: { id: item.id, tab: "tugas" } });
                    } else {
                      router.push({ pathname: "/activityprogress", params: { id: item.id, tab: "aktivitas" } });
                    }
                  }}
                >
                  <View style={styles.taskCard}>
                    <View style={[styles.taskAccent, { backgroundColor: item.accentColor }]} />
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
                    <Text style={styles.deadlineText}>{item.deadline}</Text>
                  </View>
                </Pressable>
              ))}
              {searchResults.length === 0 && (
                <Text style={styles.emptyText}>Tidak ada tugas atau aktivitas yang cocok.</Text>
              )}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={colors.iconMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>Ketik untuk memulai pencarian...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  searchHeaderRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  clearIconButton: { padding: 4 },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.onSurface, fontFamily: fonts["500"], fontSize: 14, height: "100%" },
  historySection: { gap: 8, paddingTop: 10, paddingHorizontal: 16 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyLabel: { fontSize: 12, fontFamily: fonts["700"], color: colors.onSurfaceVariant, letterSpacing: 0.4 },
  clearAllText: { fontSize: 12, fontFamily: fonts["700"], color: colors.errorStrong },
  historyScrollContent: { flexDirection: "row", gap: 10 },
  historyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceContainerLow },
  historyChipText: { color: colors.onSurfaceVariant, fontFamily: fonts["700"], fontSize: 13 },
  summaryRow: { paddingHorizontal: 18, paddingVertical: 10 },
  summaryCountText: { color: colors.onSurfaceVariant, fontFamily: fonts["700"], fontSize: 13 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 14, fontFamily: fonts["500"], color: colors.iconMuted, textAlign: "center" },
  content: { padding: 16 },
  taskCard: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  taskAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  taskTitle: { fontSize: 15, color: colors.onSurface, fontFamily: fonts["900"] },
  taskDescription: { marginTop: 4, fontSize: 13, fontFamily: fonts["400"], color: colors.tertiary },
  deadlineText: { marginTop: 8, fontSize: 11, fontFamily: fonts["700"], color: colors.iconMuted },
});