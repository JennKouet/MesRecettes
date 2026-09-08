-- AlterTable
ALTER TABLE "MenuEntry" ADD COLUMN "customEntree" TEXT;
ALTER TABLE "MenuEntry" ADD COLUMN "customPlat" TEXT;
ALTER TABLE "MenuEntry" ADD COLUMN "customDessert" TEXT;

-- Les repas libres déjà notés n'avaient qu'un intitulé : on le range dans
-- le plat pour qu'ils restent visibles et éditables dans les trois champs.
UPDATE "MenuEntry"
SET "customPlat" = "customLabel"
WHERE "customLabel" IS NOT NULL
  AND "recipeId" IS NULL
  AND "customPlat" IS NULL;
