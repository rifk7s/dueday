import { API_BASE_URL } from "@/auth/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body != null ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new ApiError(
      (errData?.message as string) ?? `HTTP ${response.status}`,
      response.status,
      errData?.errors as Record<string, string[]> | undefined,
    );
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json()) as Record<string, unknown>;
  return ("data" in data ? data.data : data) as T;
}
