"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";

export type RecipeOption = { id: string; slug: string; title: string };

/**
 * Sélecteur de recette dans un <dialog> natif : on récupère gratuitement le
 * piège à focus, la fermeture par Échap et le fond inerte.
 */
export default function RecipePicker({
  open,
  title,
  recipes,
  onSelect,
  onClose,
  pending,
}: {
  open: boolean;
  title: string;
  recipes: RecipeOption[];
  onSelect: (recipeId: string) => void;
  onClose: () => void;
  pending?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      setQuery("");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return recipes;
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(term));
  }, [query, recipes]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Choisir une recette pour ${title}`}
      className="m-auto w-[min(32rem,92vw)] rounded-xl border border-bordure bg-white p-0 text-encre backdrop:bg-encre/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-4">
          <h2 className="text-lg sm:text-xl">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Fermer">
            <span aria-hidden>✕</span>
          </Button>
        </header>

        <div>
          <label htmlFor="picker-search" className="sr-only">
            Rechercher une recette
          </label>
          <Input
            id="picker-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher…"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-encre-muted">
            Aucune recette ne correspond.
          </p>
        ) : (
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {filtered.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onSelect(recipe.id)}
                  className="w-full rounded-md px-3 py-2.5 text-left transition hover:bg-creme-100 disabled:opacity-50"
                >
                  {recipe.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
