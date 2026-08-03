import "server-only";

import { db } from "@/lib/db";
import type { TagKind } from "@/generated/prisma/enums";

/** Ordre d'affichage des familles de tags dans les filtres. */
const KIND_ORDER: TagKind[] = ["COURSE", "DIET", "CUISINE", "OTHER"];

export async function listTags() {
  const tags = await db.tag.findMany({
    select: { id: true, slug: true, name: true, kind: true },
    orderBy: { name: "asc" },
  });

  // Tri par famille puis par nom : la requête ne peut pas trier sur un ordre
  // arbitraire d'enum, on le fait donc en mémoire (une quinzaine de lignes).
  return tags.sort((a, b) => {
    const byKind = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
    return byKind !== 0 ? byKind : a.name.localeCompare(b.name, "fr");
  });
}

export type TagOption = Awaited<ReturnType<typeof listTags>>[number];
