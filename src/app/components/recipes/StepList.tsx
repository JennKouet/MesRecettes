import type { RecipeDetail } from "@/server/queries/recipes";

export default function StepList({ steps }: { steps: RecipeDetail["steps"] }) {
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="text-lg sm:text-xl">
        Préparation
      </h2>

      <ol className="mt-4 flex flex-col gap-5">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-4">
            <span
              aria-hidden
              className="shrink-0 font-title text-3xl leading-none font-bold text-tomate-300"
            >
              {index + 1}
            </span>
            <div className="prose-recette pt-1">
              <p>
                <span className="sr-only">Étape {index + 1} : </span>
                {step.content}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
