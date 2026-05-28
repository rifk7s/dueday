import { createTag, listTags, type NewTag } from "@/api/tags";
import { useSession } from "@/auth/ctx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTagsQuery() {
  const { token } = useSession();
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => listTags(token),
    staleTime: 60 * 60 * 1000,
    enabled: !!token,
  });
}

export function useCreateTagMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTag) => createTag(input, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
