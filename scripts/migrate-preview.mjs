/**
 * Applique les migrations Prisma sur Vercel (preview ET production).
 *
 * Les bases Neon de preview sont des branches vides : sans ça, une preview
 * construite après un changement de schéma lit une table absente.
 *
 * La production n'était pas migrée au build, pour éviter qu'une migration
 * ratée laisse l'ancienne app parler à un schéma déjà modifié. Oublier
 * `migrate deploy` à la main casse pourtant les nouvelles pages dès qu'elles
 * sont fusionnées (ex. /courses → table ShoppingList absente → 500).
 *
 * `migrate deploy` est idempotent. On l'applique donc aussi en production,
 * avant `next build`. Si le build échoue ensuite, l'ancien déploiement reste
 * en ligne ; une migration additive (CREATE TABLE) ne casse pas l'ancien code.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const env = process.env.VERCEL_ENV;

if (env !== "preview" && env !== "production") {
  console.log(
    `[migrate-on-vercel] VERCEL_ENV="${env ?? "(absent)"}" — rien à faire.`,
  );
  process.exit(0);
}

// prisma.config.ts lit DIRECT_URL, ou à défaut DATABASE_URL_UNPOOLED que pose
// l'intégration Neon. Sans l'une des deux, migrer est impossible : on laisse
// le build continuer plutôt que de le bloquer, l'erreur applicative étant plus
// parlante qu'un échec de build ici.
if (!process.env.DIRECT_URL && !process.env.DATABASE_URL_UNPOOLED) {
  console.warn(
    "[migrate-on-vercel] Aucune connexion directe (DIRECT_URL / DATABASE_URL_UNPOOLED). Migrations ignorées.",
  );
  process.exit(0);
}

console.log(
  `[migrate-on-vercel] Application des migrations (VERCEL_ENV=${env})…`,
);

// Le binaire est résolu explicitement plutôt que laissé au PATH : celui-ci
// contient node_modules/.bin quand le script est lancé par yarn, mais pas
// quand il est appelé directement — et dépendre de ce détail rendrait l'échec
// dépendant de la façon dont Vercel invoque la commande de build.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localPrisma = path.join(projectRoot, "node_modules", ".bin", "prisma");
const command = existsSync(localPrisma) ? localPrisma : "prisma";

const result = spawnSync(command, ["migrate", "deploy"], {
  stdio: "inherit",
  cwd: projectRoot,
});

if (result.status !== 0) {
  console.error("[migrate-on-vercel] Échec des migrations.");
  process.exit(result.status ?? 1);
}
