import { apiFetch } from "./client";

export type Tag = {
  id_tag: number;
  nama_tag: string;
  // null = global tag (read-only); a user id string = owned by that user (editable).
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type NewTag = {
  name: string;
};

type BackendTag = {
  id: number;
  name: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

const MOCK_API = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

export const mockTags: Tag[] = [
  { id_tag: 1, nama_tag: "Kuliah", user_id: null, created_at: "", updated_at: "" },
  { id_tag: 2, nama_tag: "Pekerjaan", user_id: null, created_at: "", updated_at: "" },
  { id_tag: 3, nama_tag: "Rapat", user_id: null, created_at: "", updated_at: "" },
  { id_tag: 4, nama_tag: "Rumah", user_id: null, created_at: "", updated_at: "" },
];

export function mapBackendTagToLegacy(tag: BackendTag): Tag {
  return {
    id_tag: tag.id,
    nama_tag: tag.name,
    user_id: tag.user_id ?? null,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
  };
}

/** A tag is editable/deletable only if the caller owns it (global tags are read-only). */
export function isOwnedTag(tag: Tag): boolean {
  return tag.user_id != null;
}

export async function listTags(token: string | null): Promise<Tag[]> {
  if (MOCK_API) return [...mockTags];
  const tags = await apiFetch<BackendTag[]>("/tags", token);
  return tags.map(mapBackendTagToLegacy);
}

export async function createTag(input: NewTag, token: string | null): Promise<Tag> {
  if (MOCK_API) {
    const existing = mockTags.find(
      (tag) => tag.nama_tag.toLowerCase() === input.name.toLowerCase(),
    );
    if (existing) return existing;
    const nextId = mockTags.reduce((maxId, tag) => Math.max(maxId, tag.id_tag), 0) + 1;
    const now = new Date().toISOString();
    const tag: Tag = {
      id_tag: nextId,
      nama_tag: input.name,
      user_id: "mock-user",
      created_at: now,
      updated_at: now,
    };
    mockTags.push(tag);
    return tag;
  }

  const tag = await apiFetch<BackendTag>("/tags", token, {
    method: "POST",
    body: JSON.stringify({ name: input.name }),
  });
  return mapBackendTagToLegacy(tag);
}

export async function updateTag(
  id: number,
  input: NewTag,
  token: string | null,
): Promise<Tag> {
  if (MOCK_API) {
    const tag = mockTags.find((t) => t.id_tag === id);
    if (tag) tag.nama_tag = input.name;
    return tag ?? { id_tag: id, nama_tag: input.name, user_id: "mock-user", created_at: "", updated_at: "" };
  }

  const tag = await apiFetch<BackendTag>(`/tags/${id}`, token, {
    method: "PUT",
    body: JSON.stringify({ name: input.name }),
  });
  return mapBackendTagToLegacy(tag);
}

export async function deleteTag(id: number, token: string | null): Promise<void> {
  if (MOCK_API) {
    const idx = mockTags.findIndex((t) => t.id_tag === id);
    if (idx >= 0) mockTags.splice(idx, 1);
    return;
  }

  await apiFetch<unknown>(`/tags/${id}`, token, { method: "DELETE" });
}
