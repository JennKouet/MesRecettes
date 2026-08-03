import "server-only";

import { db } from "@/lib/db";

/**
 * Lectures de recettes.
 *
 * AUCUNE de ces fonctions ne lit la session : les recettes sont publiques par
 * décision produit, y compris pour un visiteur déconnecté. Les restrictions
 * (seul l'auteur modifie ou supprime) vivent dans les Server Actions.
 */

export type RecipeFilters = {
  /** Recherche plein texte simple sur le titre et la description. */
  query?: string;
  /** Slugs de tags ; une recette doit porter TOUS les tags demandés. */
  tags?: string[];
};

export async function listRecipes({ query, tags }: RecipeFilters = {}) {
  const trimmed = query?.trim();

  return db.recipe.findMany({
    where: {
      ...(trimmed
        ? {
            OR: [
              { title: { contains: trimmed, mode: "insensitive" } },
              { description: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
      // Un AND par tag : filtrer sur `tags: { some: { slug: { in: [...] } } }`
      // renverrait les recettes portant AU MOINS UN des tags, pas tous.
      ...(tags?.length
        ? { AND: tags.map((slug) => ({ tags: { some: { tag: { slug } } } })) }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      servings: true,
      prepMinutes: true,
      cookMinutes: true,
      difficulty: true,
      author: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { slug: true, name: true, kind: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type RecipeListItem = Awaited<ReturnType<typeof listRecipes>>[number];

export async function getRecipeBySlug(slug: string) {
  return db.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      servings: true,
      prepMinutes: true,
      cookMinutes: true,
      difficulty: true,
      sourceUrl: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, name: true } },
      ingredients: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          quantity: true,
          unit: true,
          name: true,
          note: true,
        },
      },
      steps: {
        orderBy: { position: "asc" },
        select: { id: true, content: true },
      },
      tags: {
        select: { tag: { select: { slug: true, name: true, kind: true } } },
      },
    },
  });
}

export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeBySlug>>>;

/** Utilisé pour les listes courtes (accueil, sélecteur de recette du menu). */
export async function listRecipeOptions() {
  return db.recipe.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { title: "asc" },
  });
}
