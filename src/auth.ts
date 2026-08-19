import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import {
  googleSwitchCookieName,
  readGoogleSwitchCookieValue,
} from "@/lib/google-account-switch";
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
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const cookieStore = await cookies();
      const switchCookie = cookieStore.get(googleSwitchCookieName)?.value;
      const switchPayload = readGoogleSwitchCookieValue(switchCookie);
      if (!switchPayload) return true;

      const switchUserId = switchPayload.userId;
      const providerAccountId = account.providerAccountId;
      if (!providerAccountId) return false;

      const conflict = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId,
          },
        },
        select: { userId: true },
      });
      if (conflict && conflict.userId !== switchUserId) {
        cookieStore.delete(googleSwitchCookieName);
        return false;
      }

      await db.$transaction(async (tx) => {
        const owner = await tx.user.findUnique({
          where: { id: switchUserId },
          select: { id: true },
        });
        if (!owner) throw new Error("Switch target user not found.");

        await tx.account.deleteMany({
          where: {
            userId: switchUserId,
            provider: "google",
            NOT: { providerAccountId },
          },
        });

        await tx.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId,
            },
          },
          update: {
            userId: switchUserId,
            type: account.type,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state:
              typeof account.session_state === "string"
                ? account.session_state
                : null,
          },
          create: {
            userId: switchUserId,
            type: account.type,
            provider: "google",
            providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state:
              typeof account.session_state === "string"
                ? account.session_state
                : null,
          },
        });
      });

      user.id = switchUserId;
      cookieStore.delete(googleSwitchCookieName);
      return true;
    },
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
