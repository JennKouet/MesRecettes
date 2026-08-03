import Image from "next/image";
import Link from "next/link";
import { TagPill } from "../ui/TagPill";
import { DIFFICULTY_LABELS, formatTotalTime } from "@/lib/format";
import type { RecipeListItem } from "@/server/queries/recipes";

/**
 * La photo est facultative. Sans elle, un bandeau dégradé de même hauteur
 * affiche l'initiale du titre : la grille garde ainsi la même mise en page,
 * que les recettes soient illustrées ou non.
 */
export default function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const totalTime = formatTotalTime(recipe.prepMinutes, recipe.cookMinutes);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:border-tomate-300">
      <Link href={`/recettes/${recipe.slug}`} className="flex flex-1 flex-col no-underline">
        {recipe.imageUrl ? (
          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src={recipe.imageUrl}
              alt=""
              fill
              // Trois colonnes en large, deux en tablette, une en mobile :
              // évite de télécharger une image pleine largeur pour une vignette.
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition group-hover:scale-105"
            />
          </div>
        ) : (
          // Repli sans photo : le bandeau donne à la carte la même silhouette,
          // donc la grille ne bouge pas selon que la recette est illustrée ou non.
          <div
            aria-hidden
            className="flex h-40 items-center justify-center bg-linear-to-br from-safran-100 to-tomate-100"
          >
            <span className="font-title text-5xl font-bold text-tomate-300">
              {recipe.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Une recette incomplète n'est renvoyée par listRecipes qu'à son
              auteur : ce badge n'est donc jamais vu par quelqu'un d'autre. */}
          {!recipe.isComplete && (
            <span className="self-start rounded-full bg-safran-100 px-2 py-0.5 font-title text-[0.65rem] font-semibold tracking-wide text-safran-700 uppercase">
              À compléter · visible de vous seul
            </span>
          )}

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
