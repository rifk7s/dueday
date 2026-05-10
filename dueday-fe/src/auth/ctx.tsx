import { createContext, use, useMemo, type PropsWithChildren } from "react";
import {
  loginRequest,
  logoutRequest,
  type AuthUser,
  type LoginResponse,
} from "./api";
import { useStorageState } from "./useStorageState";

type SessionContextValue = {
  signIn: (username: string, password: string) => Promise<LoginResponse>;
  signOut: () => Promise<void>;
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[tokenLoading, token], setToken] = useStorageState("auth_token");
  const [[userLoading, userJson], setUserJson] = useStorageState("auth_user");

  const value = useMemo<SessionContextValue>(() => {
    const user: AuthUser | null = userJson ? safeParse(userJson) : null;

    return {
      token,
      user,
      isLoading: tokenLoading || userLoading,
      signIn: async (username, password) => {
        const result = await loginRequest(username, password);
        setToken(result.token);
        setUserJson(JSON.stringify(result.user));
        return result;
      },
      signOut: async () => {
        if (token) {
          await logoutRequest(token).catch(() => {
            // Ignore network errors on logout — clear local state regardless.
          });
        }
        setToken(null);
        setUserJson(null);
      },
    };
  }, [token, userJson, tokenLoading, userLoading, setToken, setUserJson]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

function safeParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
