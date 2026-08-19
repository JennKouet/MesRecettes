"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import {
  buildGoogleSwitchCookieValue,
  googleSwitchCookieName,
} from "@/lib/google-account-switch";
import { requireUser } from "@/lib/session";
import { signIn, signOut } from "@/auth";
import {
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "@/schemas/auth";
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

export async function updateEmailAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = updateEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const normalizedEmail = parsed.data.email.toLowerCase();

  try {
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { email: true, passwordHash: true },
    });
    if (!current) return { ok: false, message: "Compte introuvable." };
    if (!current.passwordHash) {
      return {
        ok: false,
        message:
          "vous etes connecté avec votre compte google, la modification de l'adresse email est impossible.",
      };
    }

    const password = parsed.data.currentPassword ?? "";
    const matches = await bcrypt.compare(password, current.passwordHash);
    if (!matches) {
      return {
        ok: false,
        message: "Mot de passe actuel incorrect.",
        fieldErrors: { currentPassword: ["Mot de passe actuel incorrect."] },
      };
    }

    if (normalizedEmail === current.email) {
      return { ok: true, data: undefined };
    }

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return {
        ok: false,
        message: "Cette adresse email est déjà utilisée.",
        fieldErrors: { email: ["Adresse déjà utilisée."] },
      };
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: normalizedEmail },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updatePasswordAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();

  try {
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!current?.passwordHash) {
      return {
        ok: false,
        message: "Ce compte n'utilise pas de mot de passe local.",
      };
    }

    const matches = await bcrypt.compare(
      parsed.data.currentPassword,
      current.passwordHash,
    );
    if (!matches) {
      return {
        ok: false,
        message: "Mot de passe actuel incorrect.",
        fieldErrors: { currentPassword: ["Mot de passe actuel incorrect."] },
      };
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteAccountAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Confirmation invalide.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();

  try {
    await db.user.delete({ where: { id: user.id } });
    await signOut({ redirectTo: "/" });
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function startGoogleSwitchAction() {
  const user = await requireUser();
  const cookieStore = await cookies();
  cookieStore.set(googleSwitchCookieName, buildGoogleSwitchCookieValue(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  await signIn("google", { redirectTo: "/compte?google=linked" }, { prompt: "select_account" });
}
