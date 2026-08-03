import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Client Prisma partagé.
 *
 * Prisma 7 impose un driver adapter (le moteur Rust a disparu). `@prisma/adapter-pg`
 * fonctionne aussi bien contre le Postgres local en Docker que contre Neon.
 *
 * Le garde sur globalThis évite d'ouvrir un nouveau pool de connexions à chaque
 * rechargement à chaud en développement.
 */
function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    log: ["error", "warn"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
