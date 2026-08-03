"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";

export type RecipeOption = {
  id: string;
  slug: string;
  title: string;
  isComplete: boolean;
};

type Mode = "recette" | "libre";

/**
 * Sélecteur de recette dans un <dialog> natif : on récupère gratuitement le
 * piège à focus, la fermeture par Échap et le fond inerte.
 *
 * Trois façons de remplir un créneau, sans quitter la page menu :
 *   1. choisir une recette existante ;
 *   2. créer à la volée une recette qui n'existe pas encore (titre seul) ;
 *   3. noter un repas libre (« restes »), qui ne crée aucune fiche.
 */
export default function RecipePicker({
  /**
   * Préfixe d'identifiants unique. Les 14 créneaux de la grille rendent chacun
   * leur propre <dialog> : sans ça, tous les champs partageraient le même id et
   * chaque <label for> pointerait vers le premier créneau de la page.
   */
  domId,
  open,
  title,
  recipes,
  onSelect,
  onQuickCreate,
  onCustom,
  onClose,
  pending,
  error,
}: {
  domId: string;
  open: boolean;
  title: string;
  recipes: RecipeOption[];
  onSelect: (recipeId: string) => void;
  onQuickCreate: (title: string) => void;
  onCustom: (label: string) => void;
  onClose: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("recette");
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      setQuery("");
      setCustomLabel("");
      setMode("recette");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    const term = trimmedQuery.toLowerCase();
    if (!term) return recipes;
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(term));
  }, [trimmedQuery, recipes]);

  // Proposer la création seulement si la saisie est exploitable et ne correspond
  // pas déjà exactement à une recette existante.
  const canQuickCreate =
    trimmedQuery.length >= 3 &&
    !recipes.some(
      (recipe) => recipe.title.toLowerCase() === trimmedQuery.toLowerCase(),
    );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Remplir le créneau ${title}`}
      className="m-auto w-[min(32rem,92vw)] rounded-xl border border-bordure bg-white p-0 text-encre backdrop:bg-encre/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-4">
          <h2 className="text-lg sm:text-xl">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Fermer">
            <span aria-hidden>✕</span>
          </Button>
        </header>

        <div role="tablist" className="flex gap-1 rounded-lg bg-creme-100 p-1">
          <ModeTab
            active={mode === "recette"}
            onClick={() => setMode("recette")}
          >
            Une recette
          </ModeTab>
          <ModeTab active={mode === "libre"} onClick={() => setMode("libre")}>
            Un repas libre
          </ModeTab>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-tomate-200 bg-tomate-50 px-3 py-2 text-sm text-tomate-700"
          >
            {error}
          </p>
        )}

        {mode === "recette" ? (
          <>
            <div>
              <label htmlFor={`${domId}-search`} className="sr-only">
                Rechercher ou nommer une recette
              </label>
              <Input
                id={`${domId}-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher, ou saisir un nouveau titre…"
              />
            </div>

            {filtered.length === 0 && !canQuickCreate && (
              <p className="py-4 text-center text-sm text-encre-muted">
                Aucune recette ne correspond.
              </p>
            )}

            {filtered.length > 0 && (
              <ul className="flex max-h-60 flex-col overflow-y-auto">
                {filtered.map((recipe) => (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onSelect(recipe.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition hover:bg-creme-100 disabled:opacity-50"
                    >
                      <span>{recipe.title}</span>
                      {!recipe.isComplete && (
                        <span className="shrink-0 rounded-full bg-safran-100 px-2 py-0.5 font-title text-[0.65rem] font-semibold tracking-wide text-safran-700 uppercase">
                          À compléter
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {canQuickCreate && (
              <div className="border-t border-bordure pt-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onQuickCreate(trimmedQuery)}
                  className="w-full rounded-md border border-dashed border-tomate-300 px-3 py-2.5 text-left text-tomate-700 transition hover:bg-tomate-50 disabled:opacity-50"
                >
                  + Créer «&nbsp;{trimmedQuery}&nbsp;» et la planifier ici
                </button>
                <p className="mt-2 text-xs text-encre-faint">
                  La recette sera créée vide et restera visible de vous seul
                  jusqu&apos;à ce que vous y ajoutiez ingrédients et étapes.
                </p>
              </div>
            )}
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (customLabel.trim()) onCustom(customLabel.trim());
            }}
            className="flex flex-col gap-3"
          >
            <div>
              <label htmlFor={`${domId}-custom`} className="sr-only">
                Intitulé du repas
              </label>
              <Input
                id={`${domId}-custom`}
                value={customLabel}
                onChange={(event) => setCustomLabel(event.target.value)}
                placeholder="Restes, restaurant, chez mamie…"
                maxLength={80}
              />
              <p className="mt-2 text-xs text-encre-faint">
                Aucune recette ne sera créée : c&apos;est juste une note dans
                votre semaine.
              </p>
            </div>
            <Button
              type="submit"
              disabled={pending || !customLabel.trim()}
              className="self-start"
            >
              Noter ce repas
            </Button>
          </form>
        )}
      </div>
    </dialog>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 font-title text-xs font-semibold tracking-wide uppercase transition ${
        active
          ? "bg-white text-tomate-700 shadow-card"
          : "text-encre-muted hover:text-encre"
      }`}
    >
      {children}
    </button>
  );
}
