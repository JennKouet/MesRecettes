import "server-only";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/**
 * Menu d'une semaine, pour l'utilisateur connecté UNIQUEMENT.
 *
 * La lecture passe par la contrainte unique composite `(ownerId, weekStart)` :
 * le menu d'un autre utilisateur n'est pas « filtré », il n'est jamais
 * sélectionné. Il n'existe aucun chemin permettant de le demander.
 */
export async function getMenuForWeek(weekStart: Date) {
  const user = await requireUser();

  const menu = await db.menu.findUnique({
    where: { ownerId_weekStart: { ownerId: user.id, weekStart } },
    select: {
      id: true,
      notes: true,
      entries: {
        select: {
          id: true,
          dayOfWeek: true,
          slot: true,
          customLabel: true,
          customEntree: true,
          customPlat: true,
          customDessert: true,
          recipe: {
            select: {
              id: true,
              slug: true,
              title: true,
              isComplete: true,
              prepMinutes: true,
              cookMinutes: true,
            },
          },
        },
      },
    },
  });

  return menu;
}

export type WeekMenu = Awaited<ReturnType<typeof getMenuForWeek>>;
export type MenuEntryView = NonNullable<WeekMenu>["entries"][number];
