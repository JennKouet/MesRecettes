import { z } from "zod";
import { Difficulty, Unit } from "@/generated/prisma/enums";
import { capitalizeWords } from "@/lib/format";

/**
 * Schéma unique, partagé entre react-hook-form (zodResolver, côté navigateur)
 * et les Server Actions (revalidation, côté serveur).
 *
 * C'est volontairement le même objet : les messages d'erreur français sont
 * écrits une fois, et il devient impossible que les deux validations divergent.
 * Rappel : celle du client ne protège rien, elle tourne chez l'utilisateur.
 */

/** Les champs numériques optionnels arrivent en "" depuis un <input> vide. */
const optionalNumber = z
  .union([z.number(), z.string()])
  .transform((value) => {
    if (typeof value === "number") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : Number(trimmed);
  })
  .refine((value) => value === null || Number.isFinite(value), {
    message: "Nombre invalide",
  })
  .nullable();

const optionalText = z
  .string()
  .trim()
  .max(200, "200 caractères maximum")
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const ingredientSchema = z.object({
  quantity: optionalNumber.refine(
    (value) => value === null || (value > 0 && value < 1_000_000),
    { message: "Quantité invalide" },
  ),
  unit: z
    .union([z.enum(Unit), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  name: z
    .string()
    .trim()
    .min(1, "Nom de l'ingrédient requis")
    .max(120, "120 caractères maximum")
    .transform(capitalizeWords),
  note: optionalText,
});

export const stepSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Décrivez cette étape")
    .max(2000, "2000 caractères maximum"),
});

export const recipeInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Au moins 3 caractères")
    .max(140, "140 caractères maximum"),
  description: z
    .string()
    .trim()
    .max(4000, "4000 caractères maximum")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  servings: z.coerce
    .number<number>()
    .int("Nombre entier attendu")
    .min(1, "Au moins 1 personne")
    .max(50, "50 personnes maximum"),
  prepMinutes: optionalNumber.refine(
    (value) => value === null || (value >= 0 && value <= 1440),
    { message: "Entre 0 et 1440 minutes" },
  ),
  cookMinutes: optionalNumber.refine(
    (value) => value === null || (value >= 0 && value <= 1440),
    { message: "Entre 0 et 1440 minutes" },
  ),
  difficulty: z.enum(Difficulty),
  // URL renvoyée par uploadRecipeImage. Le fichier lui-même ne transite jamais
  // par ce schéma : il est envoyé séparément, avant l'enregistrement.
  imageUrl: z
    .union([z.url(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  ingredients: z.array(ingredientSchema).min(1, "Au moins un ingrédient"),
  steps: z.array(stepSchema).min(1, "Au moins une étape"),
  tagIds: z.array(z.string()).max(12, "12 catégories maximum"),
});

/**
 * Création rapide depuis la page menu : le titre suffit.
 *
 * La recette créée ainsi est INCOMPLÈTE, donc invisible du public jusqu'à ce
 * que son auteur y ajoute des ingrédients et des étapes via le formulaire
 * complet — lequel exige les deux, si bien qu'enregistrer revient à publier.
 */
export const quickRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Au moins 3 caractères")
    .max(140, "140 caractères maximum"),
});

export type QuickRecipeInput = z.infer<typeof quickRecipeSchema>;

/** Ce que le formulaire manipule (avant transformation). */
export type RecipeFormValues = z.input<typeof recipeInputSchema>;

/** Ce que la Server Action reçoit (après transformation). */
export type RecipeInput = z.output<typeof recipeInputSchema>;
