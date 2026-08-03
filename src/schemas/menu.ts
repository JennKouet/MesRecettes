import { z } from "zod";
import { MealSlot } from "@/generated/prisma/enums";

/**
 * Le client n'envoie JAMAIS de `menuId` ni de `menuEntryId`.
 *
 * Il décrit une coordonnée — semaine, jour, créneau — et le serveur en dérive
 * le menu via `(ownerId, weekStart)`. Combiné à la contrainte
 * `@@unique([ownerId, weekStart])`, accéder au menu d'un autre utilisateur
 * n'est pas seulement interdit : c'est impossible à exprimer.
 *
 * Si un `menuId` apparaît un jour dans ce schéma, c'est une faille.
 */

/** Lundi de la semaine, au format ISO court. */
export const weekSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Semaine invalide");

export const setMenuEntrySchema = z.object({
  semaine: weekSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  slot: z.enum(MealSlot),
  recipeId: z.string().min(1),
});

/**
 * Repas libre : du texte, sans recette (« restes », « restaurant », « chez
 * mamie »). Évite de créer des fiches parasites dans le carnet pour des repas
 * qui ne sont pas des recettes.
 */
export const setCustomEntrySchema = z.object({
  semaine: weekSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  slot: z.enum(MealSlot),
  customLabel: z
    .string()
    .trim()
    .min(1, "Indiquez ce que vous prévoyez")
    .max(80, "80 caractères maximum"),
});

export const clearMenuEntrySchema = z.object({
  semaine: weekSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  slot: z.enum(MealSlot),
});

export type SetMenuEntryInput = z.infer<typeof setMenuEntrySchema>;
