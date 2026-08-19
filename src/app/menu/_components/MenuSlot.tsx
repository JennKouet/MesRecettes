"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { MealSlot } from "@/generated/prisma/enums";
import { SLOT_LABELS } from "@/lib/format";
import {
  clearMenuEntry,
  setCustomEntry,
  setMenuEntry,
} from "@/server/actions/menu-actions";
import { quickCreateRecipe } from "@/server/actions/recipe-actions";
import RecipePicker, { type RecipeOption } from "./RecipePicker";

export type SlotEntry = {
  recipe: { id: string; slug: string; title: string; isComplete: boolean } | null;
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

  const coordinate = { semaine, dayOfWeek, slot };

  function assign(recipeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setMenuEntry({ ...coordinate, recipeId });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPickerOpen(false);
      router.refresh();
    });
  }

  /** Crée la recette manquante puis l'assigne dans la foulée. */
  function createAndAssign(title: string) {
    setError(null);
    startTransition(async () => {
      const created = await quickCreateRecipe({ title });
      if (!created.ok) {
        setError(created.message);
        return;
      }

      const assigned = await setMenuEntry({
        ...coordinate,
        recipeId: created.data.id,
      });
      if (!assigned.ok) {
        // La recette existe bien, seule l'assignation a échoué : le dire
        // explicitement évite que l'utilisateur la recrée en double.
        setError(
          `« ${created.data.title} » a été créée, mais n'a pas pu être planifiée. Réessayez.`,
        );
        router.refresh();
        return;
      }

      setPickerOpen(false);
      router.refresh();
    });
  }

  function noteCustom(customLabel: string) {
    setError(null);
    startTransition(async () => {
      const result = await setCustomEntry({ ...coordinate, customLabel });
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
      const result = await clearMenuEntry(coordinate);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  const label = `${SLOT_LABELS[slot]} — ${dayLabel}`;
  const isFilled = Boolean(entry?.recipe || entry?.customLabel);

  return (
    <div className="flex h-full min-h-28 flex-col gap-1.5 rounded-lg border border-bordure bg-white p-2.5">
      <p className="font-title text-[0.65rem] font-semibold tracking-widest text-encre-faint uppercase">
        {SLOT_LABELS[slot]}
      </p>

      {isFilled ? (
        <div className="flex flex-1 flex-col gap-1.5">
          {entry?.recipe ? (
            <>
              <Link
                href={`/recettes/${entry.recipe.slug}`}
                className="break-words text-sm leading-snug font-medium text-encre no-underline hover:text-tomate-600"
              >
                {entry.recipe.title}
              </Link>
              {!entry.recipe.isComplete && (
                <span className="self-start rounded-full bg-safran-100 px-1.5 py-0.5 font-title text-[0.6rem] font-semibold tracking-wide text-safran-700 uppercase">
                  À compléter
                </span>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={isPending}
              className="break-words text-left text-sm leading-snug font-medium text-encre-muted italic underline-offset-2 hover:text-tomate-600 hover:underline disabled:opacity-50"
            >
              {entry?.customLabel}
            </button>
          )}

          <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1">
            {entry?.customLabel && !entry.recipe && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={isPending}
                className="self-start text-xs text-encre-faint underline hover:text-tomate-600 disabled:opacity-50"
              >
                Modifier
              </button>
            )}
            <button
              type="button"
              onClick={clear}
              disabled={isPending}
              className="self-start text-xs text-encre-faint underline hover:text-tomate-600 disabled:opacity-50"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={isPending}
          aria-label={`Remplir le créneau — ${label}`}
          className="flex min-h-16 flex-1 items-center justify-center rounded-md border border-dashed border-bordure text-sm text-encre-faint transition hover:border-tomate-300 hover:text-tomate-600 disabled:opacity-50"
        >
          + Ajouter
        </button>
      )}

      {error && !isPickerOpen && (
        <p role="alert" className="text-xs text-tomate-700">
          {error}
        </p>
      )}

      <RecipePicker
        domId={`picker-${dayOfWeek}-${slot}`}
        open={isPickerOpen}
        title={label}
        recipes={recipes}
        onSelect={assign}
        onQuickCreate={createAndAssign}
        onCustom={noteCustom}
        onClose={() => setPickerOpen(false)}
        pending={isPending}
        error={isPickerOpen ? error : null}
        initialMode={entry?.customLabel && !entry.recipe ? "libre" : "recette"}
        initialCustomLabel={entry?.customLabel ?? ""}
      />
    </div>
  );
}
