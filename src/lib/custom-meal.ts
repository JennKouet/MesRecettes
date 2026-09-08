import { capitalizeWords } from "./format";

export type CustomMealCourses = {
  entree: string | null;
  plat: string | null;
  dessert: string | null;
};

export const CUSTOM_MEAL_FIELDS = [
  { key: "entree", label: "Entrée", placeholder: "Salade, soupe…" },
  { key: "plat", label: "Plat", placeholder: "Restes, restaurant…" },
  { key: "dessert", label: "Dessert", placeholder: "Yaourt, fruit…" },
] as const;

/** Intitulé compact pour l'ancienne colonne `customLabel`. */
export function composeCustomLabel(courses: CustomMealCourses): string | null {
  const parts = [courses.entree, courses.plat, courses.dessert].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function hasCustomMeal(
  courses: Partial<CustomMealCourses>,
): boolean {
  return Boolean(courses.entree || courses.plat || courses.dessert);
}

export function capitalizeCourse(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : capitalizeWords(trimmed);
}
