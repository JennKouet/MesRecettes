import { z } from "zod";
import { capitalizeWords } from "@/lib/format";
import { weekSchema } from "./menu";

/**
 * Comme pour les menus : le client envoie une coordonnée (la semaine) ou
 * l'id d'un *item*, jamais l'id de la liste. Le serveur rattache toujours
 * via `(ownerId, weekStart)` ou `list.ownerId`.
 */

export const addShoppingItemSchema = z.object({
  semaine: weekSchema,
  label: z
    .string()
    .trim()
    .min(1, "Indiquez un article")
    .max(120, "120 caractères maximum")
    .transform(capitalizeWords),
});

export const shoppingItemIdSchema = z.object({
  itemId: z.string().min(1),
});

export const importShoppingSchema = z.object({
  semaine: weekSchema,
});
