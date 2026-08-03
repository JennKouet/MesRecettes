"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipe } from "@/server/actions/recipe-actions";
import { Button } from "@/app/components/ui/Button";

export default function DeleteRecipeButton({
  recipeId,
  title,
}: {
  recipeId: string;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${title} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRecipe(recipeId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/recettes");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="danger" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Suppression…" : "Supprimer"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-tomate-700">
          {error}
        </p>
      )}
    </div>
  );
}
