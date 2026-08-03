/**
 * Applique les migrations Prisma aux bases de PREVIEW uniquement.
 *
 * Pourquoi c'est nécessaire : l'intégration Neon crée une branche de base
 * dédiée à chaque preview. Ces branches ne reçoivent aucune migration
 * automatiquement, si bien qu'une preview construite après un changement de
 * schéma échoue en lisant une colonne qui n'existe pas chez elle.
 *
 * Pourquoi c'est limité aux previews : migrer pendant le build est risqué —
 * une migration qui échoue laisse l'application à moitié déployée. Sur une
 * branche de preview jetable ce risque est nul, alors qu'en production il
 * toucherait de vrais utilisateurs. La production reçoit donc ses migrations
 * depuis un terminal, délibérément, cf. README.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const env = process.env.VERCEL_ENV;

if (env !== "preview") {
  console.log(
    `[migrate-preview] VERCEL_ENV="${env ?? "(absent)"}" — rien à faire.`,
  );
  process.exit(0);
}

// prisma.config.ts lit DIRECT_URL, ou à défaut DATABASE_URL_UNPOOLED que pose
// l'intégration Neon. Sans l'une des deux, migrer est impossible : on laisse
// le build continuer plutôt que de le bloquer, l'erreur applicative sera plus
// parlante qu'un échec de build ici.
if (!process.env.DIRECT_URL && !process.env.DATABASE_URL_UNPOOLED) {
  console.warn(
    "[migrate-preview] Aucune connexion directe (DIRECT_URL / DATABASE_URL_UNPOOLED). Migrations ignorées.",
  );
  process.exit(0);
}

console.log("[migrate-preview] Application des migrations sur la base de preview…");

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
  console.error("[migrate-preview] Échec des migrations.");
  process.exit(result.status ?? 1);
}
