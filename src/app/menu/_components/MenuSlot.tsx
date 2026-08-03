"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { MealSlot } from "@/generated/prisma/enums";
import { SLOT_LABELS } from "@/lib/format";
import { clearMenuEntry, setMenuEntry } from "@/server/actions/menu-actions";
import RecipePicker, { type RecipeOption } from "./RecipePicker";

export type SlotEntry = {
  recipe: { id: string; slug: string; title: string } | null;
  customLabel: string | null;
} | null;

/**
 * Une case de la grille.
 *
 * Note importante : les actions reçoivent `{ semaine, dayOfWeek, slot }` —
 * jamais l'identifiant du menu ni celui de l'entrée. Le serveur retrouve le bon
 * menu à partir de la session. Voir src/server/actions/menu-actions.ts.
 */
export default function MenuSlot({
  semaine,
  dayOfWeek,
  slot,
  dayLabel,
  entry,
  recipes,
}: {
  semaine: string;
  dayOfWeek: number;
  slot: MealSlot;
  dayLabel: string;
  entry: SlotEntry;
  recipes: RecipeOption[];
}) {
  const router = useRouter();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function assign(recipeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setMenuEntry({ semaine, dayOfWeek, slot, recipeId });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPickerOpen(false);
      router.refresh();
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const result = await clearMenuEntry({ semaine, dayOfWeek, slot });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  const label = `${SLOT_LABELS[slot]} — ${dayLabel}`;

  return (
    // flex-1 : les deux créneaux d'un jour se partagent la hauteur, donc les
    // sept colonnes restent alignées quelle que soit la longueur des titres.
    <div className="flex min-h-24 flex-1 flex-col gap-1 rounded-lg border border-bordure bg-white p-2">
      <p className="font-title text-[0.65rem] font-semibold tracking-widest text-encre-faint uppercase">
        {SLOT_LABELS[slot]}
      </p>

      {entry?.recipe ? (
        <div className="flex flex-1 flex-col gap-1">
          <Link
            href={`/recettes/${entry.recipe.slug}`}
            className="text-sm leading-snug font-medium text-encre no-underline hover:text-tomate-600"
          >
            {entry.recipe.title}
          </Link>
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className="mt-auto self-start text-xs text-encre-faint underline hover:text-tomate-600 disabled:opacity-50"
          >
            Retirer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={isPending}
          aria-label={`Ajouter une recette — ${label}`}
          className="flex flex-1 items-center justify-center rounded-md border border-dashed border-bordure text-sm text-encre-faint transition hover:border-tomate-300 hover:text-tomate-600 disabled:opacity-50"
        >
          + Ajouter
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-tomate-700">
          {error}
        </p>
      )}

      <RecipePicker
        open={isPickerOpen}
        title={label}
        recipes={recipes}
        onSelect={assign}
        onClose={() => setPickerOpen(false)}
        pending={isPending}
      />
    </div>
  );
}
