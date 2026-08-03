import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getRecipeBySlug } from "@/server/queries/recipes";
import { getCurrentUser } from "@/lib/session";
import { DIFFICULTY_LABELS, formatMinutes } from "@/lib/format";
import { TagPill } from "../../components/ui/TagPill";
import { ButtonLink } from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import IngredientList from "../../components/recipes/IngredientList";
import StepList from "../../components/recipes/StepList";
import DeleteRecipeButton from "../_components/DeleteRecipeButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) return { title: "Recette introuvable" };

  return {
    title: recipe.title,
    description: recipe.description?.slice(0, 160) ?? undefined,
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;

  // Lecture publique pour les recettes completes ; un brouillon n'est visible
  // que de son auteur, d'ou le viewerId (getRecipeBySlug renvoie null sinon).
  const user = await getCurrentUser();
  const recipe = await getRecipeBySlug(slug, user?.id);

  if (!recipe) notFound();

  // Seul l'auteur voit les actions d'édition. Cet affichage conditionnel est
  // du confort : les Server Actions revérifient la propriété de leur côté.
  const isAuthor = user?.id === recipe.authorId;

  return (
    <article className="flex flex-col gap-8">
      {recipe.imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-bordure">
          <Image
            src={recipe.imageUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 64rem"
            className="object-cover"
            // Image principale de la page : la charger en priorité améliore
            // le Largest Contentful Paint.
            priority
          />
        </div>
      )}

      <header className="flex flex-col gap-4">
        {/* getRecipeBySlug ne renvoie un brouillon qu'à son auteur : ce bandeau
            ne s'affiche donc jamais pour un autre visiteur. */}
        {!recipe.isComplete && (
          <aside className="rounded-lg border border-safran-300 bg-safran-100 px-4 py-3">
            <p className="font-title text-sm font-semibold tracking-wide text-safran-700 uppercase">
              Brouillon — visible de vous seul
            </p>
            <p className="mt-1 text-sm text-encre-muted">
              Cette recette a été créée depuis votre menu. Ajoutez-lui au moins
              un ingrédient et une étape pour la publier dans le carnet.
            </p>
          </aside>
        )}

        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {recipe.tags.map(({ tag }) => (
              <li key={tag.slug}>
                <TagPill name={tag.name} kind={tag.kind} />
              </li>
            ))}
          </ul>
        )}

        <h1>{recipe.title}</h1>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-encre-muted">
          {recipe.prepMinutes ? (
            <div className="flex gap-1.5">
              <dt>Préparation</dt>
              <dd className="font-semibold text-encre">
                {formatMinutes(recipe.prepMinutes)}
              </dd>
            </div>
          ) : null}
          {recipe.cookMinutes ? (
            <div className="flex gap-1.5">
              <dt>Cuisson</dt>
              <dd className="font-semibold text-encre">
                {formatMinutes(recipe.cookMinutes)}
              </dd>
            </div>
          ) : null}
          <div className="flex gap-1.5">
            <dt>Portions</dt>
            <dd className="font-semibold text-encre">{recipe.servings}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Difficulté</dt>
            <dd className="font-semibold text-encre">
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </dd>
          </div>
        </dl>

        {recipe.description && (
          <div className="prose-recette max-w-2xl">
            <p>{recipe.description}</p>
          </div>
        )}

        {isAuthor && (
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/recettes/${recipe.slug}/modifier`}
              variant="ghost"
            >
              Modifier
            </ButtonLink>
            <DeleteRecipeButton recipeId={recipe.id} title={recipe.title} />
          </div>
        )}
      </header>

      {recipe.isComplete ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
          <IngredientList
            ingredients={recipe.ingredients}
            servings={recipe.servings}
          />
          <StepList steps={recipe.steps} />
        </div>
      ) : (
        // Un brouillon n'a ni ingrédients ni étapes : afficher deux listes vides
        // n'apprendrait rien. On propose directement de la compléter.
        <EmptyState
          icon="✏️"
          title="Cette recette est encore vide"
          description="Vous l'avez créée à la volée depuis votre menu. Ajoutez-lui des ingrédients et des étapes quand vous aurez un moment."
          action={
            <ButtonLink href={`/recettes/${recipe.slug}/modifier`}>
              Compléter la recette
            </ButtonLink>
          }
        />
      )}

      <footer className="border-t border-bordure pt-4 text-sm text-encre-faint">
        Ajoutée par {recipe.author.name ?? "un cuisinier anonyme"}
        {recipe.sourceUrl && (
          <>
            {" · "}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-tomate-600"
            >
              Source
            </a>
          </>
        )}
      </footer>
    </article>
  );
}
