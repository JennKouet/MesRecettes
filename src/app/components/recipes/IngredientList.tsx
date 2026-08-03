import { formatQuantity, UNIT_LABELS } from "@/lib/format";
import type { RecipeDetail } from "@/server/queries/recipes";

/**
 * Les quantités sont alignées en colonne avec `tabular-nums` : les chiffres ont
 * alors tous la même largeur, donc les nombres s'empilent proprement.
 */
export default function IngredientList({
  ingredients,
  servings,
}: {
  ingredients: RecipeDetail["ingredients"];
  servings: number;
}) {
  return (
    <section aria-labelledby="ingredients-title" className="card p-5">
      <h2 id="ingredients-title" className="text-lg sm:text-xl">
        Ingrédients
      </h2>
      <p className="mt-1 text-sm text-encre-faint">Pour {servings} personnes</p>

      <ul className="mt-4 flex flex-col divide-y divide-bordure">
        {ingredients.map((ingredient) => {
          const quantity = formatQuantity(ingredient.quantity);
          const unit = ingredient.unit ? UNIT_LABELS[ingredient.unit] : "";

          return (
            <li key={ingredient.id} className="flex gap-3 py-2.5">
              <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-encre">
                {[quantity, unit].filter(Boolean).join(" ")}
              </span>
              <span className="text-encre">
                {ingredient.name}
                {ingredient.note && (
                  <span className="text-encre-faint">, {ingredient.note}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
