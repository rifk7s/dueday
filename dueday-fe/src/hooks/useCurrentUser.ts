import { useSession } from "@/auth/ctx";
import { getCurrentUser } from "@/auth/me";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  const { token } = useSession();

  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(token),
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!token,
  });
}