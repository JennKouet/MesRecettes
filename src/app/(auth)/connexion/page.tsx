import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import LoginForm from "../_components/LoginForm";
import GoogleButton from "../_components/GoogleButton";
import { isGoogleConfigured } from "@/auth.config";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  // Déjà connecté : la page de connexion n'a plus de sens.
  if (await getCurrentUser()) redirect("/recettes");

  return (
    <div className="card flex flex-col gap-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Connexion</h1>
        <p className="mt-1 text-sm text-encre-muted">
          Pour ajouter vos recettes et planifier vos menus.
        </p>
      </header>

      <LoginForm />

      {/* Séparateur et bouton disparaissent ensemble si Google n'est pas
          configuré : un « ou » suivi de rien n'aurait aucun sens. */}
      {isGoogleConfigured && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-bordure" />
            <span className="text-xs tracking-widest text-encre-faint uppercase">
              ou
            </span>
            <span className="h-px flex-1 bg-bordure" />
          </div>

          <GoogleButton />
        </>
      )}

      <p className="text-center text-sm text-encre-muted">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="font-semibold text-tomate-600 underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
