import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

import { MealSlot } from "@/generated/prisma/enums";
import { DAY_LABELS, weekDays } from "@/lib/week";
import type { WeekMenu } from "@/server/queries/menus";
import MenuSlot from "./MenuSlot";
import type { RecipeOption } from "./RecipePicker";

const SLOTS: MealSlot[] = ["DEJEUNER", "DINER"];

/**
 * Cartes ~2× plus larges qu'une grille à 7 colonnes : 2 colonnes dès `md`,
 * 4 dès `lg` (la semaine passe sur 2 rangées). Subgrid aligne déjeuners /
 * dîners sur chaque rangée. Server Component : seules les cases sont
 * interactives.
 */
export default function MenuGrid({
  semaine,
  weekStart,
  menu,
  recipes,
}: {
  semaine: string;
  weekStart: Date;
  menu: WeekMenu;
  recipes: RecipeOption[];
}) {
  // Indexation par « jour-créneau » pour un accès direct depuis la grille.
  const byCoordinate = new Map(
    (menu?.entries ?? []).map((entry) => [
      `${entry.dayOfWeek}-${entry.slot}`,
      entry,
    ]),
  );

  const today = new Date();

  // Deux bandes de 3 lignes (en-tête / déjeuner / dîner) pour les 4+3 jours.
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:grid-rows-[auto_minmax(7rem,auto)_minmax(7rem,auto)_auto_minmax(7rem,auto)_minmax(7rem,auto)_auto_minmax(7rem,auto)_minmax(7rem,auto)_auto_minmax(7rem,auto)_minmax(7rem,auto)] lg:grid-cols-4 lg:grid-rows-[auto_minmax(7rem,auto)_minmax(7rem,auto)_auto_minmax(7rem,auto)_minmax(7rem,auto)]">
      {weekDays(weekStart).map(({ dayOfWeek, date }) => {
        const isToday = isSameDay(date, today);

        return (
          <section
            key={dayOfWeek}
            aria-labelledby={`jour-${dayOfWeek}`}
            className={`grid grid-rows-[auto_auto_auto] gap-2 rounded-xl border p-2 md:row-span-3 md:grid-rows-subgrid ${
              isToday
                ? "border-tomate-300 bg-tomate-50"
                : "border-bordure bg-creme-100"
            }`}
          >
            {/* Nom et date sur deux lignes fixes : sinon « Mercredi 5 août »
                passe à la ligne alors que « Lundi 3 août » tient, et les
                créneaux des sept colonnes ne s'alignent plus. */}
            <h2 id={`jour-${dayOfWeek}`} className="px-1 leading-tight">
              <span className="block font-title text-sm font-semibold tracking-wide uppercase">
                {DAY_LABELS[dayOfWeek]}
              </span>
              <span className="block font-title text-xs font-normal text-encre-faint">
                {format(date, "d MMMM", { locale: fr })}
              </span>
              {isToday && <span className="sr-only"> (aujourd&apos;hui)</span>}
            </h2>

            {SLOTS.map((slot) => {
              const entry = byCoordinate.get(`${dayOfWeek}-${slot}`) ?? null;

              return (
                <MenuSlot
                  key={slot}
                  semaine={semaine}
                  dayOfWeek={dayOfWeek}
                  slot={slot}
                  dayLabel={`${DAY_LABELS[dayOfWeek]} ${format(date, "d MMMM", { locale: fr })}`}
                  entry={
                    entry
                      ? {
                          recipe: entry.recipe,
                          customEntree: entry.customEntree,
                          customPlat: entry.customPlat,
                          customDessert: entry.customDessert,
                          customLabel: entry.customLabel,
                        }
                      : null
                  }
                  recipes={recipes}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
