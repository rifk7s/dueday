import { apiFetch } from "@/api/client";
import type { AuthUser } from "./api";

export function getCurrentUser(token: string | null): Promise<AuthUser> {
  return apiFetch<AuthUser>("/me", token);
}