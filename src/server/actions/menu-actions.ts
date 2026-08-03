"use server";

import { revalidatePath } from "next/cache";
import { subWeeks } from "date-fns";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseWeekParam, weekParam } from "@/lib/week";
import {
  clearMenuEntrySchema,
  setCustomEntrySchema,
  setMenuEntrySchema,
  weekSchema,
} from "@/schemas/menu";
import { toActionResult, type ActionResult } from "@/lib/errors";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Les menus sont strictement privés.
 *
 * Le motif structurant : le client fournit une COORDONNÉE (semaine, jour,
 * créneau), jamais un identifiant de ligne. Le serveur résout le menu par
 * `(ownerId, weekStart)` — l'`ownerId` venant de la session, pas de la requête.
 * Un identifiant appartenant à quelqu'un d'autre n'a donc aucun moyen d'entrer
 * dans la requête SQL.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Récupère — ou crée — le menu de la semaine pour l'utilisateur courant. */
async function resolveOwnMenu(
  tx: Pick<typeof db, "menu">,
  ownerId: string,
  weekStart: Date,
) {
  return tx.menu.upsert({
    where: { ownerId_weekStart: { ownerId, weekStart } },
    update: {},
    create: { ownerId, weekStart },
    select: { id: true },
  });
}

export async function setMenuEntry(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = setMenuEntrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Données invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const { semaine, dayOfWeek, slot, recipeId } = parsed.data;
    const weekStart = parseWeekParam(semaine);

    // On peut planifier n'importe quelle recette PUBLIQUE, y compris celle d'un
    // autre utilisateur — c'est un carnet partagé. En revanche un brouillon
    // n'est planifiable que par son auteur, sinon planifier deviendrait un
    // moyen d'apprendre le titre du brouillon de quelqu'un d'autre.
    const recipe = await db.recipe.findFirst({
      where: {
        id: recipeId,
        OR: [{ isComplete: true }, { authorId: user.id }],
      },
      select: { id: true },
    });
    if (!recipe) {
      return { ok: false, message: "Cette recette n'existe plus." };
    }

    const menu = await resolveOwnMenu(db, user.id, weekStart);

    // La contrainte @@unique([menuId, dayOfWeek, slot]) fait que réassigner un
    // créneau REMPLACE au lieu de dupliquer.
    await db.menuEntry.upsert({
      where: {
        menuId_dayOfWeek_slot: { menuId: menu.id, dayOfWeek, slot },
      },
      update: { recipeId, customLabel: null },
      create: { menuId: menu.id, dayOfWeek, slot, recipeId },
    });

    revalidatePath("/menu");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

/**
 * Repas libre : du texte dans le créneau, sans recette associée.
 * Pour « restes », « restaurant », « chez mamie » — des repas qui n'ont pas
 * vocation à devenir des fiches du carnet.
 */
export async function setCustomEntry(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = setCustomEntrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Données invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const { semaine, dayOfWeek, slot, customLabel } = parsed.data;
    const weekStart = parseWeekParam(semaine);

    const menu = await resolveOwnMenu(db, user.id, weekStart);

    await db.menuEntry.upsert({
      where: { menuId_dayOfWeek_slot: { menuId: menu.id, dayOfWeek, slot } },
      // recipeId remis à null : un repas libre remplace une recette planifiée.
      update: { customLabel, recipeId: null },
      create: { menuId: menu.id, dayOfWeek, slot, customLabel },
    });

    revalidatePath("/menu");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function clearMenuEntry(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = clearMenuEntrySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Données invalides." };
    }
    const { semaine, dayOfWeek, slot } = parsed.data;
    const weekStart = parseWeekParam(semaine);

    // deleteMany sur une jointure implicite via le menu de l'utilisateur :
    // si le menu n'est pas le sien, il n'y a simplement rien à supprimer.
    await db.menuEntry.deleteMany({
      where: {
        dayOfWeek,
        slot,
        menu: { ownerId: user.id, weekStart },
      },
    });

    revalidatePath("/menu");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

/** Recopie le menu de la semaine précédente sur la semaine demandée. */
export async function copyPreviousWeek(
  input: unknown,
): Promise<ActionResult<{ copied: number }>> {
  try {
    const user = await requireUser();

    const parsed = weekSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Semaine invalide." };
    }
    const weekStart = parseWeekParam(parsed.data);
    const previousWeek = parseWeekParam(weekParam(subWeeks(weekStart, 1)));

    // Les DEUX menus sont résolus par ownerId : impossible de copier celui d'un autre.
    const source = await db.menu.findUnique({
      where: { ownerId_weekStart: { ownerId: user.id, weekStart: previousWeek } },
      select: {
        entries: {
          select: {
            dayOfWeek: true,
            slot: true,
            recipeId: true,
            customLabel: true,
            servings: true,
          },
        },
      },
    });

    if (!source || source.entries.length === 0) {
      return { ok: false, message: "La semaine précédente est vide." };
    }

    const target = await resolveOwnMenu(db, user.id, weekStart);

    await db.$transaction([
      db.menuEntry.deleteMany({ where: { menuId: target.id } }),
      db.menuEntry.createMany({
        data: source.entries.map((entry) => ({ ...entry, menuId: target.id })),
      }),
    ]);

    revalidatePath("/menu");
    return { ok: true, data: { copied: source.entries.length } };
  } catch (error) {
    return toActionResult(error);
  }
}
