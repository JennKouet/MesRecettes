import { addDays, format, isValid, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Ramène n'importe quelle date au lundi de sa semaine, à minuit UTC.
 *
 * Le passage par Date.UTC est délibéré : la colonne `Menu.weekStart` est un
 * DATE Postgres (sans heure ni fuseau). Sans normalisation, un utilisateur en
 * UTC+12 verrait son lundi enregistré comme le dimanche précédent.
 */
export function toWeekStart(date: Date): Date {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return new Date(
    Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()),
  );
}

/** Clé d'URL : le lundi au format ISO court, lisible et triable (?semaine=2026-08-03). */
export function weekParam(weekStart: Date): string {
  return format(weekStart, "yyyy-MM-dd");
}

/**
 * Lit un `?semaine=YYYY-MM-DD` en provenance de l'URL.
 * Toute valeur absente ou invalide retombe sur la semaine courante — un
 * paramètre bricolé ne doit jamais casser la page.
 */
export function parseWeekParam(raw: string | string[] | undefined): Date {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return toWeekStart(new Date());

  const parsed = parseISO(value);
  if (!isValid(parsed)) return toWeekStart(new Date());

  return toWeekStart(parsed);
}

/** Les 7 jours de la semaine, du lundi au dimanche, avec leur numéro ISO. */
export function weekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => ({
    /** ISO : 1 = lundi … 7 = dimanche. Correspond à MenuEntry.dayOfWeek. */
    dayOfWeek: index + 1,
    date: addDays(weekStart, index),
  }));
}

/** « Semaine du 3 au 9 août 2026 » */
export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getUTCMonth() === end.getUTCMonth();

  const from = format(weekStart, sameMonth ? "d" : "d MMMM", { locale: fr });
  const to = format(end, "d MMMM yyyy", { locale: fr });

  return `Semaine du ${from} au ${to}`;
}

export const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};
