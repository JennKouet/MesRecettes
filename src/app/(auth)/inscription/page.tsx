import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import RegisterForm from "../_components/RegisterForm";
import GoogleButton from "../_components/GoogleButton";
import { isGoogleConfigured } from "@/auth.config";

export const metadata: Metadata = { title: "Inscription" };

export default async function InscriptionPage() {
  if (await getCurrentUser()) redirect("/recettes");

  return (
    <div className="card flex flex-col gap-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Créer un compte</h1>
        <p className="mt-1 text-sm text-encre-muted">
          Vos recettes seront visibles de tous ; vos menus resteront privés.
        </p>
      </header>

      <RegisterForm />

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
        Déjà inscrit ?{" "}
        <Link
          href="/connexion"
          className="font-semibold text-tomate-600 underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
