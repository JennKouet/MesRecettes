import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth-actions";

/**
 * Server Component : lit la session côté serveur.
 *
 * Comme il est rendu dans le header, il bascule toutes les routes en rendu
 * dynamique. Acceptable ici (l'app est très orientée session) ; pour rendre les
 * pages recettes statiques plus tard, il faudra le placer derrière un <Suspense>.
 */
export default async function AuthMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/connexion" className="btn btn-ghost">
        Connexion
      </Link>
    );
  }

  const initials = (user.name ?? user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        title={user.name ?? user.email}
        className="flex size-9 items-center justify-center rounded-full bg-tomate-100 font-title text-sm font-bold text-tomate-700"
      >
        {initials}
      </span>
      <span className="sr-only">Connecté en tant que {user.name ?? user.email}</span>

      <form action={logoutAction}>
        <button type="submit" className="btn btn-ghost">
          Déconnexion
        </button>
      </form>
    </div>
  );
}
