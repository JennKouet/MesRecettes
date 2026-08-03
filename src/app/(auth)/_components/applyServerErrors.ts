import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/lib/errors";

/**
 * Reporte les erreurs de champ renvoyées par une Server Action dans
 * react-hook-form, pour qu'elles s'affichent au même endroit que les erreurs de
 * validation locales.
 *
 * Le serveur revalide toujours avec le même schéma zod que le client : quand il
 * renvoie des fieldErrors, c'est soit un contrôle que le client ne peut pas
 * faire (email déjà pris), soit un appel qui a contourné le formulaire.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  result: Extract<ActionResult<unknown>, { ok: false }>,
) {
  if (!result.fieldErrors) return false;

  let applied = false;
  for (const [field, messages] of Object.entries(result.fieldErrors)) {
    const message = messages?.[0];
    if (!message) continue;

    form.setError(field as Path<T>, { type: "server", message });
    applied = true;
  }

  return applied;
}
