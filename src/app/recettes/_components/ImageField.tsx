"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";

import { uploadRecipeImage } from "@/server/actions/image-actions";
import { Button } from "@/app/components/ui/Button";
import { FieldError, Label } from "@/app/components/ui/Field";

/** Au-delà, on réduit avant d'envoyer. */
const CLIENT_MAX_WIDTH = 1600;

/**
 * Réduit l'image dans le navigateur avant l'envoi.
 *
 * Ce n'est PAS une mesure de sécurité — elle est trivialement contournable, et
 * le serveur re-décode et ré-encode tout ce qu'il reçoit (cf. src/lib/image.ts).
 * C'est une nécessité pratique : les fonctions Vercel refusent les corps de
 * requête au-delà de 4,5 Mo, et une photo de téléphone les dépasse souvent.
 *
 * En cas d'échec (navigateur récalcitrant, format exotique), on renvoie le
 * fichier d'origine : le serveur tranchera.
 */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, CLIENT_MAX_WIDTH / bitmap.width);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob) return file;

    return new File([blob], "photo.webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export default function ImageField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    startTransition(async () => {
      const prepared = await downscale(file);

      const formData = new FormData();
      formData.append("file", prepared);

      const result = await uploadRecipeImage(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onChange(result.data.url);
    });
  }

  return (
    <div>
      <Label htmlFor="recipe-image">Photo</Label>

      {value ? (
        <div className="flex flex-col items-start gap-3">
          <div className="relative h-44 w-full max-w-sm overflow-hidden rounded-lg border border-bordure">
            <Image
              src={value}
              alt="Aperçu de la photo de la recette"
              fill
              sizes="(max-width: 640px) 100vw, 24rem"
              className="object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              Remplacer
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
            >
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full max-w-sm flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-bordure text-sm text-encre-faint transition hover:border-tomate-300 hover:text-tomate-600 disabled:opacity-50"
        >
          <span aria-hidden className="text-2xl">
            📷
          </span>
          {isPending ? "Envoi…" : "Ajouter une photo"}
        </button>
      )}

      <input
        ref={inputRef}
        id="recipe-image"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Réinitialise pour que resélectionner le même fichier déclenche
          // bien un nouvel événement.
          event.target.value = "";
          if (file) handleFile(file);
        }}
      />

      <p className="mt-2 text-sm text-encre-faint">
        JPEG, PNG ou WebP. L&apos;image est réduite et convertie automatiquement.
      </p>

      <FieldError>{error}</FieldError>
    </div>
  );
}
