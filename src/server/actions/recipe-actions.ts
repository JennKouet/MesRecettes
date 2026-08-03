"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensureUniqueSlug } from "@/lib/slug";
import { recipeInputSchema, type RecipeInput } from "@/schemas/recipe";
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

    const slug = await db.$transaction(async (tx) => {
      // La propriété est DANS le WHERE. Si la recette n'existe pas ou n'est pas
      // à cet utilisateur, count vaut 0 et rien n'a été écrit.
      const { count } = await tx.recipe.updateMany({
        where: { id: recipeId, authorId: user.id },
        data: {
          title: data.title,
          description: data.description,
          servings: data.servings,
          prepMinutes: data.prepMinutes,
          cookMinutes: data.cookMinutes,
          difficulty: data.difficulty,
        },
      });

      if (count !== 1) throw new ForbiddenError();

      await replaceCollections(tx, recipeId, data);

      const recipe = await tx.recipe.findUniqueOrThrow({
        where: { id: recipeId },
        select: { slug: true },
      });
      return recipe.slug;
    });

    revalidatePath("/recettes");
    revalidatePath(`/recettes/${slug}`);
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

    // Même motif : la propriété est le prédicat de suppression.
    const { count } = await db.recipe.deleteMany({
      where: { id: recipeId, authorId: user.id },
    });

    if (count !== 1) throw new ForbiddenError();

    revalidatePath("/recettes");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}
