"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TagPillButton } from "../ui/TagPill";
import { KIND_LABELS } from "@/lib/format";
import { withQuery } from "@/lib/routes";
import type { TagKind } from "@/generated/prisma/enums";

type Tag = { id: string; slug: string; name: string; kind: TagKind };

/**
 * Filtres par tag, cumulables : `?tag=dessert&tag=francaise` sélectionne les
 * recettes portant les DEUX tags. L'état vit entièrement dans l'URL.
 */
export default function TagFilter({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = new Set(searchParams.getAll("tag"));

  function toggle(slug: string) {
    const params = new URLSearchParams(searchParams);
    const next = new Set(selected);

    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }

    params.delete("tag");
    for (const value of next) params.append("tag", value);

    router.replace(withQuery(pathname, params), { scroll: false });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams);
    params.delete("tag");
    router.replace(withQuery(pathname, params), { scroll: false });
  }

  // Regroupement par famille, en conservant l'ordre déjà appliqué par listTags().
  const groups = new Map<TagKind, Tag[]>();
  for (const tag of tags) {
    const group = groups.get(tag.kind);
    if (group) {
      group.push(tag);
    } else {
      groups.set(tag.kind, [tag]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {[...groups].map(([kind, groupTags]) => (
        <fieldset key={kind}>
          <legend className="mb-2 font-title text-xs font-semibold tracking-widest text-encre-faint uppercase">
            {KIND_LABELS[kind]}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {groupTags.map((tag) => (
              <TagPillButton
                key={tag.id}
                name={tag.name}
                kind={tag.kind}
                active={selected.has(tag.slug)}
                onClick={() => toggle(tag.slug)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {selected.size > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start text-sm text-encre-muted underline hover:text-tomate-600"
        >
          Effacer les filtres ({selected.size})
        </button>
      )}
    </div>
  );
}
