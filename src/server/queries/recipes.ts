import "server-only";

import { db } from "@/lib/db";

/**
 * Lectures de recettes.
 *
 * Deux règles de visibilité, appliquées ICI et nulle part ailleurs :
 *
 *  1. Une recette COMPLÈTE est publique — lisible même sans compte.
 *  2. Une recette INCOMPLÈTE (créée à la volée depuis la page menu, sans
 *     ingrédients ni étapes) n'est visible que par son auteur.
 *
 * D'où le paramètre `viewerId` : c'est l'identifiant de session, jamais une
 * valeur venue de la requête HTTP. Un appelant qui l'omet obtient la vue
 * strictement publique — c'est le défaut sûr.
 */

/** Prédicat de visibilité partagé par toutes les lectures. */
function visibleTo(viewerId?: string) {
  return viewerId
    ? { OR: [{ isComplete: true }, { authorId: viewerId }] }
    : { isComplete: true };
}

export type RecipeFilters = {
  /** Recherche plein texte simple sur le titre et la description. */
  query?: string;
  /** Slugs de tags ; une recette doit porter TOUS les tags demandés. */
  tags?: string[];
  /** Identifiant de l'utilisateur connecté, pour lui montrer ses brouillons. */
  viewerId?: string;
};

export async function listRecipes({
  query,
  tags,
  viewerId,
}: RecipeFilters = {}) {
  const trimmed = query?.trim();

  return db.recipe.findMany({
    where: {
      ...visibleTo(viewerId),
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
      isComplete: true,
      author: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { slug: true, name: true, kind: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type RecipeListItem = Awaited<ReturnType<typeof listRecipes>>[number];

export async function getRecipeBySlug(slug: string, viewerId?: string) {
  const recipe = await db.recipe.findUnique({
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
      isComplete: true,
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

  if (!recipe) return null;

  // Le brouillon d'un autre utilisateur est traité comme inexistant : l'appelant
  // renvoie un 404, ce qui ne révèle pas qu'une recette porte ce slug.
  if (!recipe.isComplete && recipe.authorId !== viewerId) return null;

  return recipe;
}

export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeBySlug>>>;

/**
 * Liste courte pour le sélecteur de recette du menu.
 * L'utilisateur peut planifier n'importe quelle recette publique, plus ses
 * propres brouillons — c'est tout l'intérêt de la création rapide.
 */
export async function listRecipeOptions(viewerId?: string) {
  return db.recipe.findMany({
    where: visibleTo(viewerId),
    select: { id: true, slug: true, title: true, isComplete: true },
    orderBy: { title: "asc" },
  });
}
