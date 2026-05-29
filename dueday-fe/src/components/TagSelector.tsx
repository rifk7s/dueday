import type { Tag } from "@/api/tags";
import { colors, fonts } from "@/constants/theme";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTagsQuery } from "@/hooks/useTags";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label?: string;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
};

export default function TagSelector({
  label = "Tag",
  selectedTag,
  onSelectTag,
}: Props) {
  const { data: tags = [] } = useTagsQuery();
  const [localTags, setLocalTags] = usePersistentState<Tag>("local_tags", []);
  const [visible, setVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [localError, setLocalError] = useState("");
  const [recentLocalTag, setRecentLocalTag] = useState<Tag | null>(null);
  const [modalActiveLocalId, setModalActiveLocalId] = useState<number | null>(null);

  const handleAddLocalTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    if (name.length > 10) {
      setLocalError("Tag maksimal 10 huruf.");
      return;
    }
    const nextId = -Date.now();
    const newTag: Tag = { id_tag: nextId, nama_tag: name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setLocalTags([newTag, ...localTags]);
    setNewTagName("");
    setLocalError("");
  };

  const selectedTagId = selectedTag?.id_tag ?? null;
  const recentLocalTagId = recentLocalTag?.id_tag ?? null;

  const sortedTags = useMemo(() => tags, [tags]);

  

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {sortedTags.map((tag) => {
          const isSelected = selectedTagId === tag.id_tag;
          return (
            <Pressable
              key={tag.id_tag}
              onPress={() => onSelectTag(isSelected ? null : tag)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primaryContainer
                    : colors.surfaceContainerLow,
                  borderColor: isSelected
                    ? colors.primaryContainer
                    : colors.surfaceContainerLow,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {tag.nama_tag}
              </Text>
            </Pressable>
          );
        })}
        {recentLocalTag && !sortedTags.find((t) => t.id_tag === recentLocalTag.id_tag) ? (
          <Pressable
            key={`recent-local-${recentLocalTag.id_tag}`}
            onPress={() => onSelectTag(recentLocalTag)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedTagId === recentLocalTagId
                    ? colors.primaryContainer
                    : colors.surfaceContainerLow,
                borderColor:
                  selectedTagId === recentLocalTagId
                    ? colors.primaryContainer
                    : colors.surfaceContainerLow,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selectedTagId === recentLocalTagId ? colors.onPrimary : colors.onSurfaceVariant },
              ]}
            >
              {recentLocalTag.nama_tag}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.addChip} onPress={() => setVisible(true)}>
          <Ionicons name="add" size={16} color={colors.primaryContainer} />
        </Pressable>
      </View>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Pilih Tag</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.subtitle, { marginTop: 0 }]}>Tag Lokal</Text>
            <View style={{ marginTop: 8 }}>
              {localTags.length === 0 ? (
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts["400"] }}>Belum ada tag lokal.</Text>
              ) : (
                localTags.map((tag) => (
                  <View key={`local-${tag.id_tag}`} style={{ marginBottom: 8 }}>
                    {editingId === tag.id_tag ? (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={editingText}
                          onChangeText={(text) => {
                            setEditingText(text);
                            if (localError) setLocalError("");
                          }}
                          placeholder="Nama tag"
                        />
                        <Pressable
                          style={[styles.secondaryButton, { marginLeft: 8 }]}
                          onPress={() => {
                            const trimmed = editingText.trim();
                            if (!trimmed) return;
                            if (trimmed.length > 10) {
                              setLocalError("Tag maksimal 10 huruf.");
                              return;
                            }
                            setLocalTags(localTags.map((t) => (t.id_tag === tag.id_tag ? { ...t, nama_tag: trimmed } : t)));
                            setEditingId(null);
                            setEditingText("");
                            setLocalError("");
                          }}
                        >
                          <Text style={styles.secondaryButtonText}>Simpan</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.secondaryButton, { marginLeft: 8 }]}
                          onPress={() => {
                            setEditingId(null);
                            setEditingText("");
                            setLocalError("");
                          }}
                        >
                          <Text style={styles.secondaryButtonText}>Batal</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={[
                          styles.localPill,
                          modalActiveLocalId === tag.id_tag
                            ? { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }
                            : {},
                        ]}
                        onPress={() => {
                          // activate locally in the modal (visual only)
                          setModalActiveLocalId(modalActiveLocalId === tag.id_tag ? null : tag.id_tag);
                        }}
                      >
                        <Text style={[
                          styles.pillText,
                          modalActiveLocalId === tag.id_tag ? { color: colors.onPrimary } : {},
                        ]}>{tag.nama_tag}</Text>
                        <View style={styles.pillActions}>
                          <Pressable
                            onPress={() => {
                              setEditingId(tag.id_tag);
                              setEditingText(tag.nama_tag);
                            }}
                            style={styles.pillActionBtn}
                          >
                            <Ionicons name="pencil" size={14} color={colors.onSurfaceVariant} />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              const deletingId = tag.id_tag;
                              // remove from local tags
                              setLocalTags(localTags.filter((t) => t.id_tag !== deletingId));
                              // clear recent/modal selection if it was the deleted one
                              if (recentLocalTag && recentLocalTag.id_tag === deletingId) {
                                setRecentLocalTag(null);
                              }
                              if (modalActiveLocalId === deletingId) {
                                setModalActiveLocalId(null);
                              }
                              // if the deleted tag was selected in the form, switch to default 'Rumah' if available
                              if (selectedTag && selectedTag.id_tag === deletingId) {
                                const defaultTag = sortedTags.find((t) => t.nama_tag === "Rumah");
                                onSelectTag(defaultTag ?? null);
                              }
                            }}
                            style={[styles.pillActionBtn, { marginLeft: 8 }]}
                          >
                            <Ionicons name="trash" size={14} color={colors.error} />
                          </Pressable>
                        </View>
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Tambah tag lokal..."
                placeholderTextColor={colors.iconMuted}
                value={newTagName}
                onChangeText={(text) => {
                  setNewTagName(text);
                  if (localError) setLocalError("");
                }}
              />
              {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    // reset local tags
                    setLocalTags([]);
                    setRecentLocalTag(null);
                    setLocalError("");
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </Pressable>
                <Pressable
                  style={[styles.footerButton, { marginLeft: 8 }]}
                  onPress={() => {
                    // If a local tag is active in the modal, apply it to the form and close.
                    if (modalActiveLocalId != null) {
                      const tagToApply = localTags.find((t) => t.id_tag === modalActiveLocalId);
                      if (tagToApply) {
                        onSelectTag(tagToApply);
                        setRecentLocalTag(tagToApply);
                      }
                      setModalActiveLocalId(null);
                      setVisible(false);
                      return;
                    }
                    // Otherwise, treat as add-new (retain modal open)
                    handleAddLocalTag();
                  }}
                >
                  <Text style={styles.primaryButtonText}>Simpan</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  chip: {
    maxWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts["500"],
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primaryContainer,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 8,
    maxWidth: "100%",
  },
  addChipText: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.primaryContainer,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    shadowColor: colors.onSurface,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts["400"],
    color: colors.onSurfaceVariant,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts["400"],
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  errorText: {
    marginTop: 8,
    color: colors.error,
    fontSize: 13,
    fontFamily: fonts["500"],
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
  },
  secondaryButtonText: {
    color: colors.onSurfaceVariant,
    fontFamily: fonts["600"],
  },
  footerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontFamily: fonts["600"],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  localPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLow,
  },
  pillText: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.onSurface,
  },
  pillActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  pillActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
});