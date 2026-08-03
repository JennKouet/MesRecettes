"use server";

import { signIn } from "@/auth";

/**
 * Lancement du flux Google. Volontairement dans son propre fichier : c'est la
 * seule action qui doit rediriger (vers Google), donc elle ne doit pas être
 * enveloppée dans un try/catch — `signIn` fonctionne en levant un NEXT_REDIRECT.
 */
export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/recettes" });
}
