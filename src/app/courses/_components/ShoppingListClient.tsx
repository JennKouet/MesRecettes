"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Field";
import EmptyState from "@/app/components/ui/EmptyState";
import {
  addShoppingItem,
  deleteShoppingItem,
  importWeekIngredients,
  toggleShoppingItem,
} from "@/server/actions/shopping-actions";

type Item = { id: string; label: string; checked: boolean };

export default function ShoppingListClient({
  semaine,
  items,
  canImport,
}: {
  semaine: string;
  items: Item[];
  canImport: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function refreshAfter(
    run: () => Promise<{ ok: true } | { ok: false; message: string }>,
  ) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await run();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function add(event: FormEvent) {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    refreshAfter(async () => {
      const result = await addShoppingItem({ semaine, label: trimmed });
      if (result.ok) setLabel("");
      return result;
    });
  }

  function importFromMenu() {
    refreshAfter(async () => {
      const result = await importWeekIngredients({ semaine });
      if (result.ok) {
        setInfo(
          result.data.added === 1
            ? "1 ingrédient ajouté."
            : `${result.data.added} ingrédients ajoutés.`,
        );
      }
      return result;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <form onSubmit={add} className="flex min-w-0 flex-1 gap-2">
          <label className="sr-only" htmlFor="shopping-item">
            Ajouter un article
          </label>
          <Input
            id="shopping-item"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex. lait, papier toilette…"
            maxLength={120}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !label.trim()}>
            Ajouter
          </Button>
        </form>

        <Button
          variant="ghost"
          onClick={importFromMenu}
          disabled={isPending || !canImport}
          title={
            canImport
              ? "Ajouter les ingrédients des recettes du menu"
              : "Planifiez d'abord des recettes dans le menu de cette semaine"
          }
        >
          Importer le menu
        </Button>
      </div>

      {(error || info) && (
        <p
          role={error ? "alert" : undefined}
          aria-live="polite"
          className={error ? "text-sm text-tomate-700" : "text-sm text-encre-muted"}
        >
          {error ?? info}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Liste vide"
          description="Ajoutez un article à la main, ou importez les ingrédients des recettes planifiées cette semaine."
        />
      ) : (
        <ul className="card divide-y divide-bordure">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                id={`item-${item.id}`}
                type="checkbox"
                checked={item.checked}
                disabled={isPending}
                onChange={() =>
                  refreshAfter(() => toggleShoppingItem({ itemId: item.id }))
                }
                className="size-4 rounded border-bordure text-tomate-500 focus:ring-tomate-300"
              />
              <label
                htmlFor={`item-${item.id}`}
                className={`flex-1 text-sm sm:text-base ${
                  item.checked
                    ? "text-encre-faint line-through"
                    : "text-encre"
                }`}
              >
                {item.label}
              </label>
              <button
                type="button"
                aria-label={`Supprimer ${item.label}`}
                title="Supprimer"
                disabled={isPending}
                onClick={() =>
                  refreshAfter(() => deleteShoppingItem({ itemId: item.id }))
                }
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-bordure text-encre-muted transition hover:border-tomate-300 hover:text-tomate-700 disabled:opacity-40"
              >
                <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
