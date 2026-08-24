import "server-only";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/**
 * Liste de courses de la semaine, pour l'utilisateur connecté uniquement.
 * Même motif que `getMenuForWeek` : résolution par `(ownerId, weekStart)`.
 */
export async function getShoppingListForWeek(weekStart: Date) {
  const user = await requireUser();

  return db.shoppingList.findUnique({
    where: { ownerId_weekStart: { ownerId: user.id, weekStart } },
    select: {
      items: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, checked: true },
      },
    },
  });
}

export type ShoppingListView = Awaited<
  ReturnType<typeof getShoppingListForWeek>
>;

/**
 * Ingrédients des recettes planifiées cette semaine — pour l'import
 * et pour savoir si le bouton d'import a quelque chose à proposer.
 */
export async function getWeekRecipeIngredients(weekStart: Date) {
  const user = await requireUser();

  const menu = await db.menu.findUnique({
    where: { ownerId_weekStart: { ownerId: user.id, weekStart } },
    select: {
      entries: {
        where: { recipeId: { not: null } },
        select: {
          recipe: {
            select: {
              ingredients: {
                orderBy: { position: "asc" },
                select: {
                  name: true,
                  quantity: true,
                  unit: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return menu?.entries.flatMap((entry) => entry.recipe?.ingredients ?? []) ?? [];
}
