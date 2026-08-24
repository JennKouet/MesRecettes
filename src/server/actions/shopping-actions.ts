"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseWeekParam } from "@/lib/week";
import { formatIngredientLabel } from "@/lib/format";
import {
  addShoppingItemSchema,
  importShoppingSchema,
  shoppingItemIdSchema,
} from "@/schemas/shopping";
import { toActionResult, type ActionResult } from "@/lib/errors";
import { getWeekRecipeIngredients } from "@/server/queries/shopping";

/**
 * Le client fournit une semaine ou un itemId, jamais un `listId`.
 * L'`ownerId` vient de la session. Un item d'une autre liste n'entre
 * pas dans le WHERE.
 */

async function resolveOwnList(
  tx: Pick<typeof db, "shoppingList">,
  ownerId: string,
  weekStart: Date,
) {
  return tx.shoppingList.upsert({
    where: { ownerId_weekStart: { ownerId, weekStart } },
    update: {},
    create: { ownerId, weekStart },
    select: { id: true },
  });
}

function itemNameKey(name: string, unit: string | null) {
  return `${name.trim().toLowerCase()}|${unit ?? ""}`;
}

function freeTextKey(label: string) {
  return `libre:${label.trim().toLowerCase()}`;
}

export async function addShoppingItem(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = addShoppingItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides.",
      };
    }
    const { semaine, label } = parsed.data;
    const weekStart = parseWeekParam(semaine);
    const nameKey = freeTextKey(label);

    const list = await resolveOwnList(db, user.id, weekStart);

    const duplicate = await db.shoppingListItem.findFirst({
      where: { listId: list.id, nameKey },
      select: { id: true },
    });
    if (duplicate) {
      return { ok: false, message: "Cet article est déjà sur la liste." };
    }

    const last = await db.shoppingListItem.aggregate({
      where: { listId: list.id },
      _max: { position: true },
    });

    await db.shoppingListItem.create({
      data: {
        listId: list.id,
        position: (last._max.position ?? -1) + 1,
        label,
        nameKey,
      },
    });

    revalidatePath("/courses");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function toggleShoppingItem(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = shoppingItemIdSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Données invalides." };
    }
    const { itemId } = parsed.data;

    const item = await db.shoppingListItem.findFirst({
      where: { id: itemId, list: { ownerId: user.id } },
      select: { id: true, checked: true },
    });
    if (!item) {
      return { ok: false, message: "Cet article n'existe plus." };
    }

    await db.shoppingListItem.updateMany({
      where: { id: item.id, list: { ownerId: user.id } },
      data: { checked: !item.checked },
    });

    revalidatePath("/courses");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteShoppingItem(
  input: unknown,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = shoppingItemIdSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Données invalides." };
    }

    await db.shoppingListItem.deleteMany({
      where: { id: parsed.data.itemId, list: { ownerId: user.id } },
    });

    revalidatePath("/courses");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function importWeekIngredients(
  input: unknown,
): Promise<ActionResult<{ added: number }>> {
  try {
    const user = await requireUser();

    const parsed = importShoppingSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Semaine invalide." };
    }
    const weekStart = parseWeekParam(parsed.data.semaine);

    const ingredients = await getWeekRecipeIngredients(weekStart);
    if (ingredients.length === 0) {
      return {
        ok: false,
        message:
          "Aucune recette avec ingrédients dans le menu de cette semaine.",
      };
    }

    const buckets = new Map<
      string,
      { name: string; unit: (typeof ingredients)[number]["unit"]; quantity: number | null }
    >();

    for (const ingredient of ingredients) {
      const key = itemNameKey(ingredient.name, ingredient.unit);
      const qty =
        ingredient.quantity === null || ingredient.quantity === undefined
          ? null
          : Number(ingredient.quantity);
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: qty !== null && Number.isFinite(qty) ? qty : null,
        });
        continue;
      }
      if (qty !== null && Number.isFinite(qty)) {
        existing.quantity = (existing.quantity ?? 0) + qty;
      }
    }

    const list = await resolveOwnList(db, user.id, weekStart);

    const already = await db.shoppingListItem.findMany({
      where: { listId: list.id, nameKey: { not: null } },
      select: { nameKey: true },
    });
    const existingKeys = new Set(already.map((row) => row.nameKey));

    const last = await db.shoppingListItem.aggregate({
      where: { listId: list.id },
      _max: { position: true },
    });
    let position = last._max.position ?? -1;

    const toCreate = [...buckets.entries()]
      .filter(([key]) => !existingKeys.has(key))
      .map(([nameKey, bucket]) => {
        position += 1;
        return {
          listId: list.id,
          position,
          nameKey,
          label: formatIngredientLabel(bucket.quantity, bucket.unit, bucket.name),
        };
      });

    if (toCreate.length === 0) {
      return {
        ok: false,
        message: "Tous les ingrédients du menu sont déjà sur la liste.",
      };
    }

    await db.shoppingListItem.createMany({ data: toCreate });

    revalidatePath("/courses");
    return { ok: true, data: { added: toCreate.length } };
  } catch (error) {
    return toActionResult(error);
  }
}
