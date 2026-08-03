import Link from "next/link";
import { TagPill } from "../ui/TagPill";
import { DIFFICULTY_LABELS, formatTotalTime } from "@/lib/format";
import type { RecipeListItem } from "@/server/queries/recipes";

/**
 * Pas d'image en V1. Le bandeau dégradé avec l'initiale donne à la carte la
 * bonne silhouette dès maintenant : quand les photos arriveront, il suffira de
 * remplacer ce bloc, sans retoucher la mise en page de la grille.
 */
export default function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const totalTime = formatTotalTime(recipe.prepMinutes, recipe.cookMinutes);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:border-tomate-300">
      <Link href={`/recettes/${recipe.slug}`} className="flex flex-1 flex-col no-underline">
        <div
          aria-hidden
          className="flex h-24 items-center justify-center bg-gradient-to-br from-safran-100 to-tomate-100"
        >
          <span className="font-title text-4xl font-bold text-tomate-300">
            {recipe.title.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h2 className="text-lg leading-snug sm:text-xl group-hover:text-tomate-600">
            {recipe.title}
          </h2>

          {recipe.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-encre-muted">
              {recipe.description}
            </p>
          )}

          <dl className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-encre-faint">
            {totalTime && (
              <div className="flex gap-1">
                <dt className="sr-only">Temps total</dt>
                <dd>⏱ {totalTime}</dd>
              </div>
            )}
            <div className="flex gap-1">
              <dt className="sr-only">Portions</dt>
              <dd>🍽 {recipe.servings} pers.</dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">Difficulté</dt>
              <dd>{DIFFICULTY_LABELS[recipe.difficulty]}</dd>
            </div>
          </dl>
        </div>
      </Link>

      {recipe.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 border-t border-bordure px-4 py-3">
          {recipe.tags.map(({ tag }) => (
            <li key={tag.slug}>
              <TagPill name={tag.name} kind={tag.kind} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
