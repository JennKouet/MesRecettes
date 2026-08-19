import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getMenuForWeek } from "@/server/queries/menus";
import { listRecipeOptions } from "@/server/queries/recipes";
import { parseWeekParam, weekParam } from "@/lib/week";
import WeekNav from "./_components/WeekNav";
import MenuGrid from "./_components/MenuGrid";
import CopyPreviousWeek from "./_components/CopyPreviousWeek";

export const metadata: Metadata = { title: "Menu de la semaine" };

/**
 * Server Component. La semaine est calculée au rendu à partir de `?semaine=`.
 *
 * L'ancienne version était un composant client qui initialisait son state à
 * `new Date()` puis recalculait dans un useEffect, ce qui affichait brièvement
 * la mauvaise date au premier rendu.
 *
 * En Next 16, `searchParams` est une Promise.
 */
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const { semaine: rawWeek } = await searchParams;

  // Le proxy redirige déjà, mais on revérifie : le proxy est du confort de
  // navigation, pas une barrière de sécurité.
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const weekStart = parseWeekParam(rawWeek);
  const semaine = weekParam(weekStart);

  const [menu, recipes] = await Promise.all([
    getMenuForWeek(weekStart),
    // viewerId : l'utilisateur peut planifier ses propres brouillons.
    listRecipeOptions(user.id),
  ]);

  const entryCount = menu?.entries.length ?? 0;

  return (
    // Sort du max-w-5xl du layout pour laisser de la place aux cartes plus larges.
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <p className="font-title text-sm font-semibold tracking-widest text-tomate-600 uppercase">
            Mon menu
          </p>
          <h1 className="mt-1">Menu de la semaine</h1>
        </div>

        <WeekNav weekStart={weekStart} />
      </header>

      {/* La grille s'affiche TOUJOURS, même sans aucune recette au carnet.
          Remplir un créneau ne suppose pas qu'une recette existe déjà : on peut
          en créer une à la volée depuis un simple titre, ou noter un repas libre
          qui n'en crée aucune. Masquer la grille bloquait ces deux usages. */}
      {recipes.length === 0 && (
        <aside className="rounded-lg border border-safran-300 bg-safran-100 px-4 py-3">
          <p className="text-sm text-encre-muted">
            Votre carnet est encore vide. Vous pouvez tout de même planifier :
            saisissez un titre dans un créneau pour créer la recette à la volée,
            ou notez un repas libre (« restes », « restaurant »).
          </p>
        </aside>
      )}

      <MenuGrid
        semaine={semaine}
        weekStart={weekStart}
        menu={menu}
        recipes={recipes}
      />

      <footer className="flex flex-wrap items-center gap-3 border-t border-bordure pt-4">
        <p className="text-sm text-encre-muted">
          {entryCount === 0
            ? "Semaine vide."
            : `${entryCount} repas planifié${entryCount > 1 ? "s" : ""}.`}
        </p>
        <CopyPreviousWeek semaine={semaine} />
      </footer>
      </div>
    </section>
  );
}
