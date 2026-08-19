import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import AccountSettingsForm from "./_components/AccountSettingsForm";

export const metadata: Metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      passwordHash: true,
      accounts: { where: { provider: "google" }, select: { provider: true } },
    },
  });
  if (!fullUser) redirect("/connexion");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2">
        <p className="font-title text-sm font-semibold tracking-widest text-tomate-600 uppercase">
          Paramètres
        </p>
        <h1>Mon compte</h1>
      </header>

      <AccountSettingsForm
        email={fullUser.email}
        canEditCredentials={Boolean(fullUser.passwordHash)}
        hasGoogleLinked={fullUser.accounts.length > 0}
      />
    </section>
  );
}
