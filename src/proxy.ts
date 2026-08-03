import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Next 16 a renommé la convention `middleware` en `proxy`. Le runtime est
 * `nodejs` et n'est pas configurable (l'edge n'y est pas supporté).
 *
 * Ce proxy ne fait que du confort de navigation : rediriger un visiteur non
 * connecté vers /connexion. Il n'est PAS le point d'application des droits —
 * chaque Server Action revérifie la session et la propriété des données.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // `/api` doit être exclu, sinon le proxy intercepte le route handler d'Auth.js.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
