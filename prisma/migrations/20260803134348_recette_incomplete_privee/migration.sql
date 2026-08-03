-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "isComplete" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Recipe_isComplete_createdAt_idx" ON "Recipe"("isComplete", "createdAt" DESC);
