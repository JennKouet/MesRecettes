import { z } from "zod";
import { MealSlot } from "@/generated/prisma/enums";
import { capitalizeCourse, hasCustomMeal } from "@/lib/custom-meal";

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
 * Repas libre : entrée / plat / dessert facultatifs, sans fiche recette.
 * Au moins un des trois champs doit être renseigné.
 */
const optionalCourse = z
  .string()
  .max(80, "80 caractères maximum")
  .nullish()
  .transform((value) => capitalizeCourse(value ?? ""));

export const setCustomEntrySchema = z
  .object({
    semaine: weekSchema,
    dayOfWeek: z.number().int().min(1).max(7),
    slot: z.enum(MealSlot),
    entree: optionalCourse,
    plat: optionalCourse,
    dessert: optionalCourse,
  })
  .refine((value) => hasCustomMeal(value), {
    message: "Indiquez au moins une entrée, un plat ou un dessert",
  });

export const clearMenuEntrySchema = z.object({
  semaine: weekSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  slot: z.enum(MealSlot),
});

export type SetMenuEntryInput = z.infer<typeof setMenuEntrySchema>;
