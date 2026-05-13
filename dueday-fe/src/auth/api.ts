export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  nickname: string | null;
  nim: string | null;
  photo_url: string | null;
  status: "Subscribed" | "Unsubscribed";
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

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
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
  status: "Unsubscribed",
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
      data?.message ?? "Login failed",
      response.status,
    );
  }

  return data as LoginResponse;
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
