import type { Metadata } from "next";
import { Suspense } from "react";

import { listRecipes } from "@/server/queries/recipes";
import { listTags } from "@/server/queries/tags";
import { getCurrentUser } from "@/lib/session";
import RecipeCard from "../../components/recipes/RecipeCard";
import SearchBar from "../../components/recipes/SearchBar";
import TagFilter from "../../components/recipes/TagFilter";
import EmptyState from "../../components/ui/EmptyState";
import { ButtonLink } from "../../components/ui/Button";

export const metadata: Metadata = { title: "Recettes" };

/** Next 16 : `searchParams` est une Promise. */
export default async function RecettesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedTags = params.tag
    ? Array.isArray(params.tag)
      ? params.tag
      : [params.tag]
    : [];

  // La session est lue AVANT la liste : listRecipes en a besoin pour inclure
  // les brouillons de l'utilisateur, invisibles de tous les autres.
  const user = await getCurrentUser();

  const [recipes, tags] = await Promise.all([
    listRecipes({ query: params.q, tags: selectedTags, viewerId: user?.id }),
    listTags(),
  ]);

  const isFiltered = Boolean(params.q?.trim()) || selectedTags.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Recettes</h1>
          <p className="mt-2 text-encre-muted">
            {recipes.length === 0
              ? "Aucune recette"
              : `${recipes.length} recette${recipes.length > 1 ? "s" : ""}`}
            {isFiltered ? " correspondant à votre recherche" : ""}
          </p>
        </div>

        {user && <ButtonLink href="/recettes/nouvelle">Nouvelle recette</ButtonLink>}
      </header>

      {/* useSearchParams impose une frontière Suspense côté serveur. */}
      <Suspense fallback={<div className="h-10" />}>
        <div className="flex flex-col gap-5">
          <SearchBar />
          <TagFilter tags={tags} />
        </div>
      </Suspense>

      {recipes.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon="🔍"
            title="Aucun résultat"
            description="Essayez avec moins de filtres, ou un autre mot-clé."
          />
        ) : (
          <EmptyState
            icon="📖"
            title="Le carnet est vide"
            description="Ajoutez votre première recette pour commencer à remplir le carnet."
            action={
              user ? (
                <ButtonLink href="/recettes/nouvelle">Ajouter une recette</ButtonLink>
              ) : (
                <ButtonLink href="/connexion">Se connecter pour ajouter</ButtonLink>
              )
            }
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <li key={recipe.id} className="flex">
              {/* Les trois premières tiennent dans la première rangée en large :
                  ce sont les seules visibles d'emblée. */}
              <RecipeCard recipe={recipe} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
