import { createTag, deleteTag, listTags, updateTag, type NewTag, type Tag } from "@/api/tags";
import { useSession } from "@/auth/ctx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const TAGS_KEY = ["tags"] as const;

export function useTagsQuery() {
  const { token } = useSession();
  return useQuery({
    queryKey: TAGS_KEY,
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
    onSuccess: (tag) => {
      // Write the new tag into the cache so the picker updates immediately,
      // then reconcile with the server.
      qc.setQueryData<Tag[]>(TAGS_KEY, (old = []) =>
        old.some((t) => t.id_tag === tag.id_tag) ? old : [...old, tag],
      );
      qc.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useUpdateTagMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateTag(id, { name }, token),
    onSuccess: (tag) => {
      qc.setQueryData<Tag[]>(TAGS_KEY, (old = []) =>
        old.map((t) => (t.id_tag === tag.id_tag ? tag : t)),
      );
      qc.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useDeleteTagMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTag(id, token),
    onSuccess: (_data, id) => {
      qc.setQueryData<Tag[]>(TAGS_KEY, (old = []) => old.filter((t) => t.id_tag !== id));
      qc.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}
