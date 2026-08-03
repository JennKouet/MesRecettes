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
export const authConfig = {
  pages: {
    signIn: "/connexion",
    newUser: "/recettes",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Sans ça, un utilisateur inscrit par email+mot de passe qui clique
      // ensuite « Continuer avec Google » se retrouve bloqué sur
      // OAuthAccountNotLinked. C'est sûr ici parce que Google vérifie la
      // possession de l'adresse — à ne jamais activer pour un provider qui ne
      // vérifie pas les emails.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
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
