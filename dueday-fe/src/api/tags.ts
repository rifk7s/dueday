import { apiFetch } from "./client";

export type Tag = {
  id_tag: number;
  nama_tag: string;
  created_at: string;
  updated_at: string;
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
