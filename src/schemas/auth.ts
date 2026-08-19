import { z } from "zod";

/**
 * Schémas partagés entre react-hook-form (validation côté navigateur) et les
 * Server Actions (revalidation côté serveur).
 *
 * La validation client est purement ergonomique : elle tourne dans le navigateur
 * de l'utilisateur et ne protège rien. Le serveur repasse systématiquement par
 * ces mêmes schémas.
 */

export const loginSchema = z.object({
  email: z.email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Au moins 2 caractères")
      .max(60, "60 caractères maximum"),
    email: z.email("Adresse email invalide"),
    password: z
      .string()
      .min(10, "Au moins 10 caractères")
      .max(200, "200 caractères maximum")
      .regex(/[a-zA-Z]/, "Doit contenir au moins une lettre")
      .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const updateEmailSchema = z.object({
  email: z.email("Adresse email invalide"),
  // Requis uniquement pour les comptes avec mot de passe, validé côté serveur.
  currentPassword: z.string().optional(),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(10, "Au moins 10 caractères")
      .max(200, "200 caractères maximum")
      .regex(/[a-zA-Z]/, "Doit contenir au moins une lettre")
      .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
    confirm: z.string(),
  })
  .refine((values) => values.newPassword === values.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "SUPPRIMER", {
      message: "Saisissez SUPPRIMER pour confirmer.",
    }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
