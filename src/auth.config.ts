import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Sous-ensemble léger de la configuration Auth.js, importé par `proxy.ts`.
 *
 * Il ne contient ni l'adapter Prisma ni bcrypt : depuis Next 16 le proxy tourne
 * bien en runtime Node, mais on évite quand même d'instancier un PrismaClient et
 * d'ouvrir une connexion sur *chaque* requête, y compris les pages publiques.
 *
 * Le proxy ne fait que rediriger pour le confort de navigation. L'application
 * réelle des droits vit dans les Server Actions (cf. src/lib/session.ts).
 */

/**
 * Google n'est proposé que si ses identifiants sont réellement présents.
 *
 * Sans ce garde-fou, un `GOOGLE_CLIENT_ID` absent — typiquement oublié sur
 * l'environnement Preview — empêche Auth.js de s'initialiser et fait tomber
 * TOUTE l'authentification, y compris la connexion par email et mot de passe
 * qui n'a pourtant rien à voir avec Google : l'utilisateur ne voit plus qu'une
 * page « Server error ».
 *
 * Mieux vaut perdre un bouton que perdre toute possibilité de se connecter.
 */
export const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // Sans ça, un utilisateur inscrit par email+mot de passe qui clique ensuite
  // « Continuer avec Google » se retrouve bloqué sur OAuthAccountNotLinked.
  // C'est sûr ici parce que Google vérifie la possession de l'adresse — à ne
  // jamais activer pour un provider qui ne vérifie pas les emails.
  allowDangerousEmailAccountLinking: true,
});

export const authConfig = {
  pages: {
    signIn: "/connexion",
    newUser: "/recettes",
  },
  providers: isGoogleConfigured ? [googleProvider] : [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const path = request.nextUrl.pathname;

      const isProtected =
        path.startsWith("/menu") ||
        path === "/recettes/nouvelle" ||
        /^\/recettes\/[^/]+\/modifier$/.test(path);

      if (isProtected && !isLoggedIn) return false; // → redirection vers pages.signIn
      return true;
    },
  },
} satisfies NextAuthConfig;
