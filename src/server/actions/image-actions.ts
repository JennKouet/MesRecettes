"use server";

import { put } from "@vercel/blob";

import { requireUser } from "@/lib/session";
import { InvalidImageError, processRecipeImage } from "@/lib/image";
import { toActionResult, type ActionResult } from "@/lib/errors";

/**
 * Envoi d'une photo de recette.
 *
 * La photo part sur Blob AVANT que la recette soit enregistrée : le formulaire
 * ne manipule ensuite qu'une URL. Conséquence assumée — abandonner le
 * formulaire après avoir choisi une photo laisse un fichier orphelin. À l'échelle
 * d'un carnet familial c'est négligeable face aux 5 Go inclus ; si ça devenait
 * gênant, un nettoyage périodique comparerait les blobs aux `Recipe.imageUrl`.
 */
export async function uploadRecipeImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, message: "Aucun fichier reçu." };
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        ok: false,
        message:
          "Le stockage des images n'est pas configuré (BLOB_READ_WRITE_TOKEN manquant).",
      };
    }

    // Décodage, redimensionnement et ré-encodage : c'est ici que le fichier
    // devient sûr, pas dans le navigateur.
    const image = await processRecipeImage(file);

    const blob = await put(
      `recettes/${user.id}/${crypto.randomUUID()}.${image.extension}`,
      image.data,
      {
        access: "public",
        contentType: image.contentType,
        // Le chemin contient déjà un UUID : le suffixe aléatoire de Vercel
        // ferait double emploi et rendrait l'URL inutilement longue.
        addRandomSuffix: false,
        // Les photos sont immuables (une modification écrit un nouveau blob).
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      },
    );

    return { ok: true, data: { url: blob.url } };
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return { ok: false, message: error.message };
    }
    return toActionResult(error);
  }
}
