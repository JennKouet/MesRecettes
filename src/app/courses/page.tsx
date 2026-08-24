import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { parseWeekParam, weekParam } from "@/lib/week";
import {
  getShoppingListForWeek,
  getWeekRecipeIngredients,
} from "@/server/queries/shopping";
import WeekNav from "../menu/_components/WeekNav";
import ShoppingListClient from "./_components/ShoppingListClient";

export const metadata: Metadata = { title: "Liste de courses" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const { semaine: rawWeek } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const weekStart = parseWeekParam(rawWeek);
  const semaine = weekParam(weekStart);

  const [list, weekIngredients] = await Promise.all([
    getShoppingListForWeek(weekStart),
    getWeekRecipeIngredients(weekStart),
  ]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <p className="font-title text-sm font-semibold tracking-widest text-tomate-600 uppercase">
            Courses
          </p>
          <h1 className="mt-1">Liste de courses</h1>
          <p className="mt-2 text-encre-muted">
            Cochez ce que vous avez, ajoutez du texte libre, ou importez les
            ingrédients des recettes de la semaine.
          </p>
        </div>

        <WeekNav weekStart={weekStart} basePath="/courses" />
      </header>

      <ShoppingListClient
        semaine={semaine}
        items={list?.items ?? []}
        canImport={weekIngredients.length > 0}
      />
    </section>
  );
}
