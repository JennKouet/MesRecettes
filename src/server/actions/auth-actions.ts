"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { toActionResult, type ActionResult } from "@/lib/errors";

/**
 * Inscription par email + mot de passe.
 *
 * `input` est volontairement typé `unknown` : il arrive du réseau, la validation
 * react-hook-form côté client ne garantit rien.
 */
export async function registerAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return {
        ok: false,
        message: "Un compte existe déjà avec cette adresse email.",
        fieldErrors: { email: ["Adresse déjà utilisée"] },
      };
    }

    await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    // `redirect: false` : c'est le composant client qui navigue ensuite. Ça évite
    // que le NEXT_REDIRECT soit avalé par ce try/catch.
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

/** Connexion par email + mot de passe. */
export async function loginAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      // Message volontairement générique : ne pas révéler si c'est l'adresse
      // qui est inconnue ou le mot de passe qui est faux.
      return { ok: false, message: "Identifiants invalides." };
    }
    return toActionResult(error);
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
