// Prisma 7 : la configuration du CLI vit ici et non plus dans package.json.
// Elle ne charge plus .env automatiquement, d'où l'import dotenv explicite.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Le CLI (migrate) utilise la connexion DIRECTE — sur Neon, l'hôte non poolé,
    // sinon `migrate` échoue sur des advisory locks.
    // Le runtime applicatif utilise DATABASE_URL via le driver adapter (src/lib/db.ts).
    url: env("DIRECT_URL"),
  },
});
