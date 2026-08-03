// Prisma 7 : la configuration du CLI vit ici et non plus dans package.json.
// Elle ne charge plus .env automatiquement, d'où l'import dotenv explicite.
import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * URL utilisée par le CLI Prisma (migrate, db seed) : la connexion DIRECTE.
 *
 * Elle doit viser l'hôte NON poolé. Les migrations prennent des advisory locks,
 * que le PgBouncer de Neon ne gère pas en mode transaction — passer par l'hôte
 * poolé fait échouer `migrate`.
 *
 * `DATABASE_URL_UNPOOLED` est le nom que pose automatiquement l'intégration Neon
 * de Vercel. On l'accepte en repli pour éviter d'avoir à recopier la valeur d'une
 * variable à l'autre : ce genre de copie manuelle est une source d'erreurs.
 *
 * (Le runtime applicatif, lui, utilise DATABASE_URL — l'hôte poolé — via le
 * driver adapter, cf. src/lib/db.ts.)
 */
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!directUrl) {
  throw new Error(
    "Connexion directe absente : définissez DIRECT_URL (ou DATABASE_URL_UNPOOLED, " +
      "posée automatiquement par l'intégration Neon de Vercel). En local, " +
      "copiez .env.example vers .env.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
