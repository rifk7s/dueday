import type { Tag } from "@/api/tags";
import { colors, fonts } from "@/constants/theme";
import { useCreateTagMutation, useTagsQuery } from "@/hooks/useTags";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

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
  const createTagMutation = useCreateTagMutation();
  const [visible, setVisible] = useState(false);
  const [tagName, setTagName] = useState("");
  const [localError, setLocalError] = useState("");

  const selectedTagId = selectedTag?.id_tag ?? null;

  const sortedTags = useMemo(() => tags, [tags]);

  const openModal = () => {
    setTagName("");
    setLocalError("");
    createTagMutation.reset();
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setTagName("");
    setLocalError("");
    createTagMutation.reset();
  };

  const handleCreate = () => {
    const nextName = tagName.trim();
    if (!nextName) {
      setLocalError("Nama tag wajib diisi.");
      return;
    }

    const existingTag = tags.find(
      (tag) => tag.nama_tag.toLowerCase() === nextName.toLowerCase(),
    );

    if (existingTag) {
      onSelectTag(existingTag);
      closeModal();
      return;
    }

    setLocalError("");
    createTagMutation.mutate(
      { name: nextName },
      {
        onSuccess: (createdTag) => {
          onSelectTag(createdTag);
          closeModal();
        },
      },
    );
  };

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

        <Pressable style={styles.addChip} onPress={openModal}>
          <Ionicons name="add" size={16} color={colors.primaryContainer} />
          <Text style={styles.addChipText}>Tambah tag</Text>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Tambah Tag</Text>
                <Text style={styles.subtitle}>Buat tag baru untuk dipakai di semua form.</Text>
              </View>
              <Pressable onPress={closeModal} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Contoh: Organisasi"
              placeholderTextColor={colors.iconMuted}
              value={tagName}
              onChangeText={(text) => {
                setTagName(text);
                if (localError) setLocalError("");
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />

            {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
            {createTagMutation.isError ? (
              <Text style={styles.errorText}>
                {createTagMutation.error instanceof Error
                  ? createTagMutation.error.message
                  : "Gagal membuat tag baru."}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={closeModal}>
                <Text style={styles.secondaryButtonText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, createTagMutation.isPending && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={createTagMutation.isPending}
              >
                {createTagMutation.isPending ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Simpan</Text>
                )}
              </Pressable>
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
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    minWidth: 96,
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
});