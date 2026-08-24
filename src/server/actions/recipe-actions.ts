"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import { deleteBlobQuietly } from "@/lib/blob";
import {
  quickRecipeSchema,
  recipeInputSchema,
  type RecipeInput,
} from "@/schemas/recipe";
import {
  ForbiddenError,
  toActionResult,
  type ActionResult,
} from "@/lib/errors";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Rappel de sécurité — à lire avant de toucher ce fichier.
 *
 * Chaque fonction exportée ici est un endpoint HTTP POST public. Next.js lui
 * attribue un identifiant stable ; n'importe qui peut l'appeler avec un corps
 * forgé, sans jamais ouvrir l'interface. Trois règles en découlent :
 *
 *   1. `requireUser()` en première ligne de chaque mutation.
 *   2. Revalidation zod de l'entrée, qui arrive typée `unknown`.
 *   3. La PROPRIÉTÉ s'exprime dans le WHERE SQL (`updateMany` / `deleteMany`
 *      avec `authorId`), jamais dans un `if` préalable. C'est atomique — pas de
 *      fenêtre entre le contrôle et l'écriture — et on ne peut pas oublier
 *      d'exploiter le résultat du contrôle.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Une recette n'est publique que lorsqu'elle a au moins un ingrédient ET une
 * étape. Le schéma zod du formulaire complet exige déjà les deux, donc tout
 * passage par ce formulaire publie la recette ; seule la création rapide
 * produit un brouillon.
 *
 * Ce calcul est centralisé ici pour que la colonne ne puisse pas dériver.
 */
function computeIsComplete(data: RecipeInput): boolean {
  return data.ingredients.length > 0 && data.steps.length > 0;
}

/** Remplace en bloc ingrédients, étapes et tags. Doit tourner dans une transaction. */
async function replaceCollections(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  recipeId: string,
  data: RecipeInput,
) {
  // Delete-all + recreate : ajout, suppression et réordonnancement suivent
  // ainsi un seul chemin de code. Les ids changent, mais rien ne les référence
  // (MenuEntry pointe sur Recipe, pas sur Ingredient).
  await tx.ingredient.deleteMany({ where: { recipeId } });
  await tx.step.deleteMany({ where: { recipeId } });
  await tx.recipeTag.deleteMany({ where: { recipeId } });

  await tx.ingredient.createMany({
    data: data.ingredients.map((ingredient, position) => ({
      recipeId,
      position,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      name: ingredient.name,
      note: ingredient.note,
    })),
  });

  await tx.step.createMany({
    data: data.steps.map((step, position) => ({
      recipeId,
      position,
      content: step.content,
    })),
  });

  if (data.tagIds.length > 0) {
    await tx.recipeTag.createMany({
      data: data.tagIds.map((tagId) => ({ recipeId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createRecipe(
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const user = await requireUser();

    const parsed = recipeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Données invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.title, async (candidate) => {
      const existing = await db.recipe.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return existing !== null;
    });

    await db.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          slug,
          title: data.title,
          description: data.description,
          servings: data.servings,
          prepMinutes: data.prepMinutes,
          cookMinutes: data.cookMinutes,
          difficulty: data.difficulty,
          imageUrl: data.imageUrl,
          isComplete: computeIsComplete(data),
          // Jamais lu depuis l'entrée client : c'est la session qui fait foi.
          authorId: user.id,
        },
        select: { id: true },
      });

      await replaceCollections(tx, recipe.id, data);
    });

    revalidatePath("/recettes");
    return { ok: true, data: { slug } };
  } catch (error) {
    return toActionResult(error);
  }
}

/**
 * Création rapide depuis la page menu : un titre suffit.
 *
 * La recette est créée INCOMPLÈTE, donc invisible de tous sauf de son auteur,
 * jusqu'à ce qu'il y ajoute ingrédients et étapes. C'est volontaire : on ne
 * publie pas une fiche vide dans le carnet commun juste parce que quelqu'un
 * planifiait sa semaine.
 */
export async function quickCreateRecipe(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; title: string }>> {
  try {
    const user = await requireUser();

    const parsed = quickRecipeSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Titre invalide.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const { title } = parsed.data;

    const slug = await ensureUniqueSlug(title, async (candidate) => {
      const existing = await db.recipe.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return existing !== null;
    });

    const recipe = await db.recipe.create({
      data: {
        slug,
        title,
        authorId: user.id,
        isComplete: false,
      },
      select: { id: true, slug: true, title: true },
    });

    revalidatePath("/recettes");
    return { ok: true, data: recipe };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateRecipe(
  recipeId: string,
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const user = await requireUser();

    const parsed = recipeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Données invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const data = parsed.data;

    // Photo et slug actuels, relevés avant l'écriture. Filtrés par authorId
    // pour ne rien apprendre sur la recette d'un autre.
    const previous = await db.recipe.findFirst({
      where: { id: recipeId, authorId: user.id },
      select: { imageUrl: true, slug: true, title: true },
    });
    if (!previous) throw new ForbiddenError();

    // On ne recalcule l'URL que si le titre, une fois slugifié, a vraiment
    // changé. Un simple « Tarte aux pommes » → « Tarte aux pommes ! » ne doit
    // pas faire passer `tarte-aux-pommes-2` à `tarte-aux-pommes` (l'ancienne
    // URL casserait sans raison). La recette en cours est exclue de isTaken
    // pour ne pas se voir refuser son propre slug.
    const slug =
      slugify(data.title) === slugify(previous.title)
        ? previous.slug
        : await ensureUniqueSlug(data.title, async (candidate) => {
            const existing = await db.recipe.findUnique({
              where: { slug: candidate },
              select: { id: true },
            });
            return existing !== null && existing.id !== recipeId;
          });

    await db.$transaction(async (tx) => {
      // La propriété est DANS le WHERE. Si la recette n'existe pas ou n'est pas
      // à cet utilisateur, count vaut 0 et rien n'a été écrit.
      const { count } = await tx.recipe.updateMany({
        where: { id: recipeId, authorId: user.id },
        data: {
          slug,
          title: data.title,
          description: data.description,
          servings: data.servings,
          prepMinutes: data.prepMinutes,
          cookMinutes: data.cookMinutes,
          difficulty: data.difficulty,
          imageUrl: data.imageUrl,
          // Compléter un brouillon le rend public ; c'est le seul moyen de publier.
          isComplete: computeIsComplete(data),
        },
      });

      if (count !== 1) throw new ForbiddenError();

      await replaceCollections(tx, recipeId, data);
    });

    // Après le commit seulement : si la transaction avait échoué, on aurait
    // supprimé la photo d'une recette restée inchangée.
    if (previous.imageUrl && previous.imageUrl !== data.imageUrl) {
      await deleteBlobQuietly(previous.imageUrl);
    }

    revalidatePath("/recettes");
    revalidatePath(`/recettes/${slug}`);
    if (slug !== previous.slug) {
      revalidatePath(`/recettes/${previous.slug}`);
    }
    return { ok: true, data: { slug } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteRecipe(
  recipeId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    // Relevée avant la suppression : après, la ligne n'existe plus.
    const doomed = await db.recipe.findFirst({
      where: { id: recipeId, authorId: user.id },
      select: { imageUrl: true },
    });

    // Même motif : la propriété est le prédicat de suppression.
    const { count } = await db.recipe.deleteMany({
      where: { id: recipeId, authorId: user.id },
    });

    if (count !== 1) throw new ForbiddenError();

    await deleteBlobQuietly(doomed?.imageUrl);

    revalidatePath("/recettes");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}
