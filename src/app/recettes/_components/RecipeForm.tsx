"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Difficulty } from "@/generated/prisma/enums";
import { DIFFICULTY_LABELS, KIND_LABELS } from "@/lib/format";
import { recipeInputSchema, type RecipeFormValues } from "@/schemas/recipe";
import { createRecipe, updateRecipe } from "@/server/actions/recipe-actions";
import type { TagOption } from "@/server/queries/tags";
import { FormRow, Input, Textarea, Select } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { TagPillButton } from "@/app/components/ui/TagPill";
import { applyServerErrors } from "@/app/(auth)/_components/applyServerErrors";
import IngredientRows from "./IngredientRows";
import StepRows from "./StepRows";

export const EMPTY_RECIPE: RecipeFormValues = {
  title: "",
  description: "",
  servings: 4,
  prepMinutes: "",
  cookMinutes: "",
  difficulty: "FACILE",
  ingredients: [{ quantity: "", unit: "", name: "", note: "" }],
  steps: [{ content: "" }],
  tagIds: [],
};

export default function RecipeForm({
  tags,
  defaultValues = EMPTY_RECIPE,
  /** Absent en création, présent en modification. */
  recipeId,
}: {
  tags: TagOption[];
  defaultValues?: RecipeFormValues;
  recipeId?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RecipeFormValues>({
    // Le resolver applique le même schéma zod que la Server Action.
    // Ici c'est du confort ; là-bas c'est la sécurité.
    resolver: zodResolver(recipeInputSchema),
    defaultValues,
  });

  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const result = recipeId
      ? await updateRecipe(recipeId, values)
      : await createRecipe(values);

    if (!result.ok) {
      const handled = applyServerErrors(form, result);
      if (!handled) setServerError(result.message);
      return;
    }

    router.push(`/recettes/${result.data.slug}`);
    router.refresh();
  });

  // Regroupement des tags par famille pour l'affichage.
  const tagGroups = new Map<TagOption["kind"], TagOption[]>();
  for (const tag of tags) {
    const group = tagGroups.get(tag.kind);
    if (group) group.push(tag);
    else tagGroups.set(tag.kind, [tag]);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-tomate-200 bg-tomate-50 px-3 py-2 text-sm text-tomate-700"
        >
          {serverError}
        </p>
      )}

      <section className="card flex flex-col gap-4 p-5">
        <FormRow label="Titre" htmlFor="title" error={errors.title?.message}>
          <Input
            id="title"
            placeholder="Tarte aux pommes de mamie"
            invalid={Boolean(errors.title)}
            {...form.register("title")}
          />
        </FormRow>

        <FormRow
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          hint="Facultatif. Un mot sur l'origine de la recette, une astuce…"
        >
          <Textarea
            id="description"
            rows={3}
            invalid={Boolean(errors.description)}
            {...form.register("description")}
          />
        </FormRow>

        <div className="grid gap-4 sm:grid-cols-4">
          <FormRow
            label="Portions"
            htmlFor="servings"
            error={errors.servings?.message}
          >
            <Input
              id="servings"
              type="number"
              min="1"
              max="50"
              invalid={Boolean(errors.servings)}
              {...form.register("servings")}
            />
          </FormRow>

          <FormRow
            label="Préparation (min)"
            htmlFor="prepMinutes"
            error={errors.prepMinutes?.message}
          >
            <Input
              id="prepMinutes"
              type="number"
              min="0"
              invalid={Boolean(errors.prepMinutes)}
              {...form.register("prepMinutes")}
            />
          </FormRow>

          <FormRow
            label="Cuisson (min)"
            htmlFor="cookMinutes"
            error={errors.cookMinutes?.message}
          >
            <Input
              id="cookMinutes"
              type="number"
              min="0"
              invalid={Boolean(errors.cookMinutes)}
              {...form.register("cookMinutes")}
            />
          </FormRow>

          <FormRow
            label="Difficulté"
            htmlFor="difficulty"
            error={errors.difficulty?.message}
          >
            <Select id="difficulty" {...form.register("difficulty")}>
              {Object.values(Difficulty).map((level) => (
                <option key={level} value={level}>
                  {DIFFICULTY_LABELS[level]}
                </option>
              ))}
            </Select>
          </FormRow>
        </div>
      </section>

      <section className="card p-5">
        <IngredientRows
          control={form.control}
          register={form.register}
          errors={errors.ingredients as never}
        />
        {errors.ingredients?.root?.message && (
          <p role="alert" className="mt-2 text-sm text-tomate-700">
            {errors.ingredients.root.message}
          </p>
        )}
      </section>

      <section className="card p-5">
        <StepRows
          control={form.control}
          register={form.register}
          errors={errors.steps as never}
        />
        {errors.steps?.root?.message && (
          <p role="alert" className="mt-2 text-sm text-tomate-700">
            {errors.steps.root.message}
          </p>
        )}
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="text-lg sm:text-xl">Catégories</h2>

        <Controller
          control={form.control}
          name="tagIds"
          render={({ field }) => (
            <div className="flex flex-col gap-4">
              {[...tagGroups].map(([kind, groupTags]) => (
                <fieldset key={kind}>
                  <legend className="mb-2 font-title text-xs font-semibold tracking-widest text-encre-faint uppercase">
                    {KIND_LABELS[kind]}
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {groupTags.map((tag) => {
                      const active = field.value.includes(tag.id);
                      return (
                        <TagPillButton
                          key={tag.id}
                          name={tag.name}
                          kind={tag.kind}
                          active={active}
                          onClick={() =>
                            field.onChange(
                              active
                                ? field.value.filter((id) => id !== tag.id)
                                : [...field.value, tag.id],
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        />

        {errors.tagIds?.message && (
          <p role="alert" className="text-sm text-tomate-700">
            {errors.tagIds.message}
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Enregistrement…"
            : recipeId
              ? "Enregistrer les modifications"
              : "Créer la recette"}
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
