import { apiFetch } from "./client";

export type Tag = {
  id_tag: number;
  nama_tag: string;
  created_at: string;
  updated_at: string;
};

export type NewTag = {
  name: string;
};

type BackendTag = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

const MOCK_API = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

export const mockTags: Tag[] = [
  { id_tag: 1, nama_tag: "Kuliah", created_at: "", updated_at: "" },
  { id_tag: 2, nama_tag: "Pekerjaan", created_at: "", updated_at: "" },
  { id_tag: 3, nama_tag: "Rapat", created_at: "", updated_at: "" },
  { id_tag: 4, nama_tag: "Rumah", created_at: "", updated_at: "" },
];

export function mapBackendTagToLegacy(tag: BackendTag): Tag {
  return {
    id_tag: tag.id,
    nama_tag: tag.name,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
  };
}

export async function listTags(token: string | null): Promise<Tag[]> {
  if (MOCK_API) return [...mockTags];
  const tags = await apiFetch<BackendTag[]>("/tags", token);
  return tags.map(mapBackendTagToLegacy);
}

export async function createTag(input: NewTag, token: string | null): Promise<Tag> {
  if (MOCK_API) {
    const nextId = mockTags.reduce((maxId, tag) => Math.max(maxId, tag.id_tag), 0) + 1;
    const now = new Date().toISOString();
    const tag: Tag = {
      id_tag: nextId,
      nama_tag: input.name,
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
