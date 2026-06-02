import { isOwnedTag, type Tag } from "@/api/tags";
import { colors, fonts } from "@/constants/theme";
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from "@/hooks/useTags";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label?: string;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
};

const MAX_TAG_LENGTH = 10;

export default function TagSelector({
  label = "Tag",
  selectedTag,
  onSelectTag,
}: Props) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTagsQuery();
  const createTag = useCreateTagMutation();
  const updateTag = useUpdateTagMutation();
  const deleteTag = useDeleteTagMutation();

  const [visible, setVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState("");

  const selectedTagId = selectedTag?.id_tag ?? null;
  const busy = createTag.isPending || updateTag.isPending || deleteTag.isPending;
  // The modal manages only the user's own tags; global tags are picker-only (chip row).
  const ownedTags = tags.filter(isOwnedTag);

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name || createTag.isPending) return;
    if (name.length > MAX_TAG_LENGTH) {
      setError(t("components.tagSelector.maxLength", { max: MAX_TAG_LENGTH }));
      return;
    }
    try {
      const tag = await createTag.mutateAsync({ name });
      onSelectTag(tag);
      setNewTagName("");
      setError("");
      setVisible(false);
    } catch {
      setError(t("components.tagSelector.addFailed"));
    }
  };

  const handleRenameTag = async (tag: Tag) => {
    const trimmed = editingText.trim();
    if (!trimmed || updateTag.isPending) return;
    if (trimmed.length > MAX_TAG_LENGTH) {
      setError(t("components.tagSelector.maxLength", { max: MAX_TAG_LENGTH }));
      return;
    }
    try {
      const updated = await updateTag.mutateAsync({ id: tag.id_tag, name: trimmed });
      if (selectedTagId === tag.id_tag) onSelectTag(updated);
      setEditingId(null);
      setEditingText("");
      setError("");
    } catch {
      setError(t("components.tagSelector.renameFailed"));
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      t("components.tagSelector.deleteTitle"),
      t("components.tagSelector.deleteConfirm", { name: tag.nama_tag }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTag.mutateAsync(tag.id_tag);
              if (selectedTagId === tag.id_tag) onSelectTag(null);
              if (editingId === tag.id_tag) {
                setEditingId(null);
                setEditingText("");
              }
            } catch {
              setError(t("components.tagSelector.deleteFailed"));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {tags.map((tag) => {
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
        <Pressable style={styles.addChip} onPress={() => setVisible(true)}>
          <Ionicons name="add" size={16} color={colors.primaryContainer} />
        </Pressable>
      </View>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("components.tagSelector.title")}</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={{ marginTop: 8 }}>
              {ownedTags.length === 0 ? (
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts["400"] }}>{t("components.tagSelector.emptyLocal")}</Text>
              ) : (
                ownedTags.map((tag) => (
                  <View key={`tag-${tag.id_tag}`} style={{ marginBottom: 8 }}>
                    {editingId === tag.id_tag ? (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={editingText}
                          onChangeText={(text) => {
                            setEditingText(text);
                            if (error) setError("");
                          }}
                          placeholder={t("components.tagSelector.namePlaceholder")}
                        />
                        <Pressable
                          style={[styles.secondaryButton, { marginLeft: 8 }, updateTag.isPending && styles.buttonDisabled]}
                          disabled={updateTag.isPending}
                          onPress={() => handleRenameTag(tag)}
                        >
                          <Text style={styles.secondaryButtonText}>{t("common.save")}</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.secondaryButton, { marginLeft: 8 }]}
                          onPress={() => {
                            setEditingId(null);
                            setEditingText("");
                            setError("");
                          }}
                        >
                          <Text style={styles.secondaryButtonText}>{t("common.cancel")}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={[
                          styles.localPill,
                          selectedTagId === tag.id_tag
                            ? { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }
                            : {},
                        ]}
                        onPress={() => {
                          onSelectTag(tag);
                          setVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.pillText,
                          selectedTagId === tag.id_tag ? { color: colors.onPrimary } : {},
                        ]}>{tag.nama_tag}</Text>
                        {isOwnedTag(tag) ? (
                          <View style={styles.pillActions}>
                            <Pressable
                              onPress={() => {
                                setEditingId(tag.id_tag);
                                setEditingText(tag.nama_tag);
                                setError("");
                              }}
                              style={styles.pillActionBtn}
                            >
                              <Ionicons name="pencil" size={14} color={colors.onSurfaceVariant} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteTag(tag)}
                              style={[styles.pillActionBtn, { marginLeft: 8 }]}
                            >
                              <Ionicons name="trash" size={14} color={colors.error} />
                            </Pressable>
                          </View>
                        ) : null}
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <TextInput
                style={styles.input}
                placeholder={t("components.tagSelector.newTagPlaceholder")}
                placeholderTextColor={colors.iconMuted}
                value={newTagName}
                maxLength={MAX_TAG_LENGTH}
                onChangeText={(text) => {
                  setNewTagName(text);
                  if (error) setError("");
                }}
                onSubmitEditing={handleAddTag}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
                <Pressable
                  style={[styles.footerButton, busy && styles.buttonDisabled]}
                  disabled={busy}
                  onPress={handleAddTag}
                >
                  <Text style={styles.primaryButtonText}>{createTag.isPending ? t("common.saving") : t("components.tagSelector.add")}</Text>
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
