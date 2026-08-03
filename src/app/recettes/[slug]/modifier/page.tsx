import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getRecipeBySlug } from "@/server/queries/recipes";
import { listTags } from "@/server/queries/tags";
import RecipeForm from "../../_components/RecipeForm";
import type { RecipeFormValues } from "@/schemas/recipe";

export const metadata: Metadata = { title: "Modifier une recette" };

export default async function ModifierRecettePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [recipe, tags] = await Promise.all([
    getRecipeBySlug(slug, user.id),
    listTags(),
  ]);
  if (!recipe) notFound();

  // Un non-auteur ne doit pas voir le formulaire pré-rempli d'autrui. On renvoie
  // un 404 plutôt qu'un 403 : ça ne révèle pas que la recette lui est refusée.
  // (La vraie barrière reste le WHERE de updateRecipe.)
  if (recipe.authorId !== user.id) notFound();

  const defaultValues: RecipeFormValues = {
    title: recipe.title,
    description: recipe.description ?? "",
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes ?? "",
    cookMinutes: recipe.cookMinutes ?? "",
    difficulty: recipe.difficulty,
    imageUrl: recipe.imageUrl ?? "",
    // Un brouillon créé depuis le menu n'a ni ingrédient ni étape : on amorce
    // une ligne vide de chaque, sinon useFieldArray n'affiche aucun champ et il
    // n'y a plus rien à remplir.
    ingredients: recipe.ingredients.length
      ? recipe.ingredients.map((ingredient) => ({
          // quantity est un Decimal Prisma : on le ramène en nombre pour l'input.
          quantity:
            ingredient.quantity === null ? "" : Number(ingredient.quantity),
          unit: ingredient.unit ?? "",
          name: ingredient.name,
          note: ingredient.note ?? "",
        }))
      : [{ quantity: "", unit: "", name: "", note: "" }],
    steps: recipe.steps.length
      ? recipe.steps.map((step) => ({ content: step.content }))
      : [{ content: "" }],
    tagIds: [],
  };

  // Les identifiants de tags ne sont pas dans le select de getRecipeBySlug
  // (qui n'expose que slug/name/kind pour l'affichage) : on les recompose ici.
  const selectedSlugs = new Set(recipe.tags.map(({ tag }) => tag.slug));
  defaultValues.tagIds = tags
    .filter((tag) => selectedSlugs.has(tag.slug))
    .map((tag) => tag.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1>Modifier la recette</h1>
        <p className="mt-2 text-encre-muted">{recipe.title}</p>
      </header>

      <RecipeForm tags={tags} defaultValues={defaultValues} recipeId={recipe.id} />
    </div>
  );
}
