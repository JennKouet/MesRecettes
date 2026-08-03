"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Unit } from "@/generated/prisma/enums";
import { UNIT_LABELS } from "@/lib/format";
import type { RecipeFormValues } from "@/schemas/recipe";
import { Input, Select, FieldError } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";

/**
 * `useFieldArray` est la raison principale d'utiliser react-hook-form ici :
 * il garde les erreurs de validation alignées sur les bons index quand on
 * ajoute, supprime ou déplace des lignes.
 */
export default function IngredientRows({
  control,
  register,
  errors,
}: {
  control: Control<RecipeFormValues>;
  register: UseFormRegister<RecipeFormValues>;
  errors?: Record<string, { name?: { message?: string }; quantity?: { message?: string } }>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "ingredients",
  });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-title text-sm font-semibold tracking-wide text-encre-muted uppercase">
        Ingrédients
      </legend>

      <ul className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowErrors = errors?.[index];

          return (
            <li key={field.id} className="flex flex-col gap-1">
              <div className="grid grid-cols-[5rem_8rem_1fr_auto] items-start gap-2 max-sm:grid-cols-2">
                <div>
                  <label className="sr-only" htmlFor={`ing-qty-${index}`}>
                    Quantité de l&apos;ingrédient {index + 1}
                  </label>
                  <Input
                    id={`ing-qty-${index}`}
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Qté"
                    invalid={Boolean(rowErrors?.quantity)}
                    {...register(`ingredients.${index}.quantity`)}
                  />
                </div>

                <div>
                  <label className="sr-only" htmlFor={`ing-unit-${index}`}>
                    Unité de l&apos;ingrédient {index + 1}
                  </label>
                  <Select id={`ing-unit-${index}`} {...register(`ingredients.${index}.unit`)}>
                    <option value="">— unité —</option>
                    {Object.values(Unit).map((unit) => (
                      <option key={unit} value={unit}>
                        {UNIT_LABELS[unit] || "pièce"}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="max-sm:col-span-2">
                  <label className="sr-only" htmlFor={`ing-name-${index}`}>
                    Nom de l&apos;ingrédient {index + 1}
                  </label>
                  <Input
                    id={`ing-name-${index}`}
                    placeholder="farine, beurre doux…"
                    invalid={Boolean(rowErrors?.name)}
                    {...register(`ingredients.${index}.name`)}
                  />
                </div>

                <RowControls
                  index={index}
                  count={fields.length}
                  onMove={move}
                  onRemove={remove}
                  label={`l'ingrédient ${index + 1}`}
                />
              </div>

              <FieldError>
                {rowErrors?.name?.message ?? rowErrors?.quantity?.message}
              </FieldError>
            </li>
          );
        })}
      </ul>

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => append({ quantity: "", unit: "", name: "", note: "" })}
      >
        + Ajouter un ingrédient
      </Button>
    </fieldset>
  );
}

export function RowControls({
  index,
  count,
  onMove,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconButton
        label={`Monter ${label}`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </IconButton>
      <IconButton
        label={`Descendre ${label}`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </IconButton>
      <IconButton
        label={`Supprimer ${label}`}
        // On ne descend jamais en dessous d'une ligne : le schéma en exige une.
        disabled={count <= 1}
        onClick={() => onRemove(index)}
        className="hover:border-tomate-300 hover:text-tomate-700"
      >
        ✕
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-md border border-bordure bg-white text-encre-muted transition hover:bg-creme-100 disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ""}`}
      {...props}
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
