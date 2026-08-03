import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/schemas/auth";

// Hash factice, jamais égal à un mot de passe réel. Sert uniquement à faire
// tourner bcrypt.compare quand l'utilisateur n'existe pas, pour que le temps de
// réponse soit le même dans les deux cas (pas d'oracle par timing sur
// l'existence d'un compte).
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidOeKbYQFPjKZQZ7lFqZ8fJhVQz8Zq6vG";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // Le client Prisma vient du dossier généré (Prisma 7), alors que le peer
  // dependency de l'adapter vise le paquet @prisma/client. Le montage est celui
  // documenté par Prisma ; seul le type diverge.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),

  // Auth.js force la stratégie JWT dès qu'un provider Credentials est présent :
  // la valeur retournée par authorize() n'atteint jamais createSession() de
  // l'adapter. On l'assume. Les User/Account restent persistés en Postgres via
  // l'adapter, ce qui est l'essentiel. Contrepartie : une session ne peut pas
  // être révoquée instantanément côté serveur.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        const passwordMatches = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        // Un compte créé via Google n'a pas de passwordHash : il ne doit pas
        // pouvoir se connecter par mot de passe.
        if (!user?.passwordHash || !passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
