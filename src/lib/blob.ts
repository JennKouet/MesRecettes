import "server-only";

import { del } from "@vercel/blob";

/**
 * Supprime un blob, en silence si ça échoue.
 *
 * Ce module est `server-only` et NON `"use server"` : la suppression ne doit
 * surtout pas devenir une Server Action. Ce serait un endpoint public capable
 * d'effacer n'importe quel fichier du stockage sur simple appel.
 * Elle n'est appelée que depuis des actions qui ont déjà vérifié la propriété
 * de la recette concernée.
 *
 * L'échec est avalé volontairement : un blob orphelin est un désagrément, mais
 * faire échouer la suppression d'une recette parce que son fichier a déjà
 * disparu serait bien pire.
 */
export async function deleteBlobQuietly(url: string | null | undefined) {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return;

  // Ne jamais tenter de supprimer une URL qui ne vient pas de notre stockage.
  if (!url.includes(".blob.vercel-storage.com")) return;

  try {
    await del(url);
  } catch (error) {
    console.error("Suppression du blob impossible :", url, error);
  }
}
