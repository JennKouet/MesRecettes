export class UnauthorizedError extends Error {
  constructor() {
    super("Vous devez être connecté pour faire cela.");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Action non autorisée.");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Introuvable.");
    this.name = "NotFoundError";
  }
}

/** Forme de retour uniforme de toutes les Server Actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      /** Erreurs par champ, remontées dans react-hook-form via form.setError(). */
      fieldErrors?: Record<string, string[] | undefined>;
    };

/**
 * Convertit une exception en résultat affichable.
 *
 * Forbidden et NotFound produisent volontairement la même forme de sortie :
 * l'interface ne doit jamais permettre de distinguer « cette recette existe
 * mais n'est pas à vous » de « cette recette n'existe pas ». Ne pas « corriger »
 * ça en séparant les deux cas — ce serait un oracle d'existence.
 */
export function toActionResult(error: unknown): ActionResult<never> {
  if (
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof NotFoundError
  ) {
    return { ok: false, message: error.message };
  }

  console.error(error);
  return { ok: false, message: "Une erreur est survenue. Réessayez." };
}
