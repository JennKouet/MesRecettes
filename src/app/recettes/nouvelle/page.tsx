import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { listTags } from "@/server/queries/tags";
import RecipeForm from "../_components/RecipeForm";

export const metadata: Metadata = { title: "Nouvelle recette" };

export default async function NouvelleRecettePage() {
  // Le proxy redirige déjà, mais on revérifie ici : le proxy est du confort de
  // navigation, pas une barrière de sécurité.
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const tags = await listTags();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1>Nouvelle recette</h1>
        <p className="mt-2 text-encre-muted">
          Elle sera visible par tout le monde ; vous seul pourrez la modifier.
        </p>
      </header>

      <RecipeForm tags={tags} />
    </div>
  );
}
