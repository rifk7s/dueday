import { useSession } from "@/auth/ctx";
import { listTags, type Tag } from "@/api/tags";
import { useQuery } from "@tanstack/react-query";

export function useTagsQuery() {
  const { token } = useSession();
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => listTags(token),
    staleTime: 60 * 60 * 1000,
    enabled: !!token,
  });
}

export function useTagIdByName(name: string | null): number | undefined {
  const { data: tags } = useTagsQuery();
  if (!name || !tags) return undefined;
  return tags.find(
    (t: Tag) => t.nama_tag.toLowerCase() === name.toLowerCase(),
  )?.id_tag;
}
