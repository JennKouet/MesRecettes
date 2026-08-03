import { auth } from "@/auth";
import { UnauthorizedError } from "./errors";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

/** Utilisateur courant, ou null. Ne lève jamais — pour l'affichage conditionnel. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Point d'entrée unique de toutes les mutations.
 *
 * Chaque Server Action est un endpoint HTTP POST public : Next.js lui attribue
 * un identifiant stable et n'importe qui peut l'appeler avec un corps forgé.
 * Masquer un bouton dans l'interface ne protège rien — d'où cet appel en
 * première ligne de chaque action.
 *
 * Toute la connaissance d'Auth.js du projet transite par ce fichier : c'est
 * délibéré, ça rend un éventuel changement de librairie d'auth local à un seul
 * module.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
