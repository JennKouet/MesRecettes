import type {
  Difficulty,
  MealSlot,
  TagKind,
  Unit,
} from "@/generated/prisma/enums";

/**
 * Libellés d'affichage. Ce module ne doit JAMAIS importer `server-only` ni la
 * base : il est consommé aussi bien par des Server Components que par des
 * composants client (RecipeForm, TagFilter).
 */

export const KIND_LABELS: Record<TagKind, string> = {
  COURSE: "Type de plat",
  DIET: "Régime",
  CUISINE: "Cuisine",
  OTHER: "Autre",
};

/** Abréviations affichées à côté des quantités. */
export const UNIT_LABELS: Record<Unit, string> = {
  G: "g",
  KG: "kg",
  ML: "ml",
  CL: "cl",
  L: "l",
  CUILLERE_A_CAFE: "c. à café",
  CUILLERE_A_SOUPE: "c. à soupe",
  PINCEE: "pincée",
  GOUSSE: "gousse",
  TRANCHE: "tranche",
  SACHET: "sachet",
  BOTTE: "botte",
  PIECE: "",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  FACILE: "Facile",
  MOYEN: "Moyen",
  DIFFICILE: "Difficile",
};

export const SLOT_LABELS: Record<MealSlot, string> = {
  DEJEUNER: "Déjeuner",
  DINER: "Dîner",
};

/**
 * Les quantités sont des Decimal Prisma. On les rend en notation française
 * (virgule décimale) et sans zéros inutiles : 1.50 → « 1,5 », 2.00 → « 2 ».
 */
export function formatQuantity(quantity: unknown): string {
  if (quantity === null || quantity === undefined) return "";

  const value = Number(quantity);
  if (!Number.isFinite(value)) return "";

  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/** « 1 h 15 » plutôt que « 75 min » au-delà d'une heure. */
export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
}

/** Temps total affiché sur les cartes : préparation + cuisson. */
export function formatTotalTime(
  prepMinutes: number | null | undefined,
  cookMinutes: number | null | undefined,
): string {
  const total = (prepMinutes ?? 0) + (cookMinutes ?? 0);
  return formatMinutes(total);
}
