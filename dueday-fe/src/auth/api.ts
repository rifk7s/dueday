import { Platform } from "react-native";
import Constants from "expo-constants";

const DEV_PORT = 8000;
const API_PATH = "/api";

function normalizeOverride(url: string): string {
  return `${url.trim().replace(/\/+$/, "").replace(/\/api$/, "")}${API_PATH}`;
}

function devServerHost(): string | null {
  // In Expo Go / `expo start`, hostUri is "<host>:<metroPort>" — e.g.
  // "192.168.1.50:8081" (physical device, LAN) or "localhost:8081"
  // (iOS sim / Android emulator with adb-reverse / web).
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.replace(/^[a-z]+:\/\//i, "").split(":")[0]?.trim();
  return host && host.length > 0 ? host : null;
}

function resolveApiUrl(): string {
  // 1. Explicit override always wins (tunnel, staging, custom port).
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override && override.trim().length > 0) return normalizeOverride(override);

  // 2. Web runs on the dev machine itself.
  if (Platform.OS === "web") return `http://localhost:${DEV_PORT}${API_PATH}`;

  const host = devServerHost();

  // 3. No hostUri (standalone build) — last-resort default.
  //    TODO: point at the deployed API origin once one exists.
  if (!host) {
    return Platform.OS === "android"
      ? `http://10.0.2.2:${DEV_PORT}${API_PATH}`
      : `http://localhost:${DEV_PORT}${API_PATH}`;
  }

  // 4. Loopback hostUri = iOS sim / Android emulator / adb-reverse.
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return Platform.OS === "android"
      ? `http://10.0.2.2:${DEV_PORT}${API_PATH}`   // emulator → host alias
      : `http://localhost:${DEV_PORT}${API_PATH}`; // iOS sim shares host net
  }

  // 5. LAN host from the scanned QR = physical device via Expo Go.
  //    Reuse that host, swap Metro's port for the Laravel port.
  return `http://${host}:${DEV_PORT}${API_PATH}`;
}

export const API_BASE_URL = resolveApiUrl();

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  nickname: string | null;
  nim: string | null;
  photo_url: string | null;
  status: "subscribed" | "unsubscribed";
  subscription_end: string | null;
  language: "Indonesia" | "English";
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  token_type: "Bearer";
  user: AuthUser;
};

export type ForgotPasswordResponse = {
  message: string;
  email?: string;
  token?: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  passwordConfirmation: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function resolveErrorMessage(
  data: { message?: string; errors?: Record<string, string[]> } | null,
  fallback: string,
): string {
  const fieldMessage = data?.errors
    ? Object.values(data.errors).flat().find((message) => message.length > 0)
    : null;

  return fieldMessage ?? data?.message ?? fallback;
}

const MOCK_AUTH = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

const MOCK_USER: AuthUser = {
  id: "1",
  username: "cheryl",
  email: "cheryl@dueday.dev",
  name: "Cherryl Callista",
  nickname: "Cheryl",
  nim: "123456789",
  photo_url: null,
  status: "unsubscribed",
  subscription_end: null,
  language: "Indonesia",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function loginRequest(
  username: string,
  password: string,
): Promise<LoginResponse> {
  if (MOCK_AUTH) {
    return {
      message: "Mock login successful",
      token: "mock-token-dev",
      token_type: "Bearer",
      user: MOCK_USER,
    };
  }

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthError(
      resolveErrorMessage(data, "Login failed"),
      response.status,
    );
  }

  return data as LoginResponse;
}

export async function forgotPasswordRequest(email: string): Promise<ForgotPasswordResponse> {
  if (MOCK_AUTH) {
    return {
      message: "Mock reset link sent",
    };
  }

  const response = await fetch(`${API_BASE_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthError(
      resolveErrorMessage(data, "Failed to send reset link"),
      response.status,
    );
  }

  return data as ForgotPasswordResponse;
}

export async function resetPasswordRequest({
  email,
  token,
  password,
  passwordConfirmation,
}: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  if (MOCK_AUTH) {
    return {
      message: "Mock password reset successful",
    };
  }

  const response = await fetch(`${API_BASE_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthError(
      resolveErrorMessage(data, "Failed to reset password"),
      response.status,
    );
  }

  return data as ResetPasswordResponse;
}

export async function logoutRequest(token: string): Promise<void> {
  if (MOCK_AUTH) return;

  await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
}
