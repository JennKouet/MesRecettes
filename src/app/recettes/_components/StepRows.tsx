"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import type { RecipeFormValues } from "@/schemas/recipe";
import { Textarea, FieldError } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { RowControls } from "./IngredientRows";

export default function StepRows({
  control,
  register,
  errors,
}: {
  control: Control<RecipeFormValues>;
  register: UseFormRegister<RecipeFormValues>;
  errors?: Record<string, { content?: { message?: string } }>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-title text-sm font-semibold tracking-wide text-encre-muted uppercase">
        Préparation
      </legend>

      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <li key={field.id} className="flex flex-col gap-1">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-2 w-6 shrink-0 text-right font-title text-xl font-bold text-tomate-300"
              >
                {index + 1}
              </span>

              <div className="flex-1">
                <label className="sr-only" htmlFor={`step-${index}`}>
                  Étape {index + 1}
                </label>
                <Textarea
                  id={`step-${index}`}
                  rows={3}
                  placeholder="Décrivez cette étape…"
                  invalid={Boolean(errors?.[index]?.content)}
                  {...register(`steps.${index}.content`)}
                />
              </div>

              <RowControls
                index={index}
                count={fields.length}
                onMove={move}
                onRemove={remove}
                label={`l'étape ${index + 1}`}
              />
            </div>

            <FieldError>{errors?.[index]?.content?.message}</FieldError>
          </li>
        ))}
      </ol>

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => append({ content: "" })}
      >
        + Ajouter une étape
      </Button>
    </fieldset>
  );
}
