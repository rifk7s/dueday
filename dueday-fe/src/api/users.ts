import { apiFetch } from "./client";
import type { AuthUser } from "@/auth/api";

export async function getMe(token: string | null): Promise<AuthUser> {
  return apiFetch<AuthUser>(`/me`, token);
}

export async function updateMe(
  input: Partial<{ nickname: string; language: "Indonesia" | "English" }>,
  token: string | null,
): Promise<AuthUser> {
  return apiFetch<AuthUser>(`/me`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
