"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  deleteAccountSchema,
  updateEmailSchema,
  updatePasswordSchema,
  type UpdateEmailInput,
  type UpdatePasswordInput,
} from "@/schemas/auth";
import {
  deleteAccountAction,
  startGoogleSwitchAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/server/actions/auth-actions";
import { FormRow, Input } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { applyServerErrors } from "@/app/(auth)/_components/applyServerErrors";

export default function AccountSettingsForm({
  email,
  canEditCredentials,
  hasGoogleLinked,
}: {
  email: string;
  canEditCredentials: boolean;
  hasGoogleLinked: boolean;
}) {
  type DeleteAccountFormValues = { confirmation: string };

  const router = useRouter();
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const emailForm = useForm<UpdateEmailInput>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: { email, currentPassword: "" },
  });

  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  const deleteForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "" },
  });

  const submitEmail = emailForm.handleSubmit(async (values) => {
    setEmailMessage(null);
    const result = await updateEmailAction(values);
    if (!result.ok) {
      applyServerErrors(emailForm, result);
      setEmailMessage(result.message);
      return;
    }

    setEmailMessage("Adresse email mise à jour.");
    router.refresh();
  });

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    setPasswordMessage(null);
    const result = await updatePasswordAction(values);
    if (!result.ok) {
      applyServerErrors(passwordForm, result);
      setPasswordMessage(result.message);
      return;
    }

    setPasswordMessage("Mot de passe mis à jour.");
    passwordForm.reset({ currentPassword: "", newPassword: "", confirm: "" });
  });

  const submitDelete = deleteForm.handleSubmit(async (values) => {
    setDeleteMessage(null);
    const result = await deleteAccountAction(values);
    if (!result.ok) {
      applyServerErrors(deleteForm, result);
      setDeleteMessage(result.message);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <article className="card space-y-4 p-5">
        <h2 className="text-lg">Adresse email</h2>
        {emailMessage && (
          <p className="rounded-lg border border-bordure bg-creme-100 px-3 py-2 text-sm text-encre-muted">
            {emailMessage}
          </p>
        )}
        {canEditCredentials ? (
          <form onSubmit={submitEmail} noValidate className="flex flex-col gap-3">
            <FormRow
              label="Nouvelle adresse email"
              htmlFor="email"
              error={emailForm.formState.errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={Boolean(emailForm.formState.errors.email)}
                {...emailForm.register("email")}
              />
            </FormRow>

            <FormRow
              label="Mot de passe actuel"
              htmlFor="currentPassword"
              hint="Requis pour confirmer le changement d'email."
              error={emailForm.formState.errors.currentPassword?.message}
            >
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(emailForm.formState.errors.currentPassword)}
                {...emailForm.register("currentPassword")}
              />
            </FormRow>

            <Button type="submit" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting
                ? "Mise à jour…"
                : "Changer l'email"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-encre-muted">
            vous etes connecté avec votre compte google, la modification de
            l&apos;adresse email est impossible.
          </p>
        )}
      </article>

      {canEditCredentials ? (
        <article className="card space-y-4 p-5">
          <h2 className="text-lg">Mot de passe</h2>
          {passwordMessage && (
            <p className="rounded-lg border border-bordure bg-creme-100 px-3 py-2 text-sm text-encre-muted">
              {passwordMessage}
            </p>
          )}
          <form
            onSubmit={submitPassword}
            noValidate
            className="flex flex-col gap-3"
          >
            <FormRow
              label="Mot de passe actuel"
              htmlFor="pw-current"
              error={passwordForm.formState.errors.currentPassword?.message}
            >
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                {...passwordForm.register("currentPassword")}
              />
            </FormRow>
            <FormRow
              label="Nouveau mot de passe"
              htmlFor="pw-new"
              error={passwordForm.formState.errors.newPassword?.message}
            >
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordForm.formState.errors.newPassword)}
                {...passwordForm.register("newPassword")}
              />
            </FormRow>
            <FormRow
              label="Confirmer le nouveau mot de passe"
              htmlFor="pw-confirm"
              error={passwordForm.formState.errors.confirm?.message}
            >
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordForm.formState.errors.confirm)}
                {...passwordForm.register("confirm")}
              />
            </FormRow>

            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting
                ? "Mise à jour…"
                : "Changer le mot de passe"}
            </Button>
          </form>
        </article>
      ) : (
        <article className="card space-y-2 p-5">
          <h2 className="text-lg">Mot de passe</h2>
          <p className="text-sm text-encre-muted">
            Ce compte utilise uniquement la connexion Google. Aucun mot de passe
            local n&apos;est configuré.
          </p>
        </article>
      )}

      {hasGoogleLinked && (
        <article className="card space-y-3 p-5">
          <h2 className="text-lg">Connexion Google</h2>
          <p className="text-sm text-encre-muted">
            Vous pouvez remplacer le compte Google utilisé pour vous connecter,
            sans perdre vos données.
          </p>
          <form action={startGoogleSwitchAction}>
            <Button type="submit">Changer de compte Google</Button>
          </form>
        </article>
      )}

      <article className="card space-y-4 border-tomate-200 p-5">
        <h2 className="text-lg text-tomate-700">Supprimer le compte</h2>
        <p className="text-sm text-encre-muted">
          Cette action est définitive : vos recettes, menus et accès seront
          supprimés.
        </p>
        {deleteMessage && (
          <p className="rounded-lg border border-tomate-200 bg-tomate-50 px-3 py-2 text-sm text-tomate-700">
            {deleteMessage}
          </p>
        )}
        <form onSubmit={submitDelete} noValidate className="flex flex-col gap-3">
          <FormRow
            label='Tapez "SUPPRIMER" pour confirmer'
            htmlFor="confirmation"
            error={deleteForm.formState.errors.confirmation?.message}
          >
            <Input
              id="confirmation"
              autoComplete="off"
              invalid={Boolean(deleteForm.formState.errors.confirmation)}
              {...deleteForm.register("confirmation")}
            />
          </FormRow>

          <Button
            type="submit"
            variant="danger"
            disabled={deleteForm.formState.isSubmitting}
          >
            {deleteForm.formState.isSubmitting
              ? "Suppression…"
              : "Supprimer mon compte"}
          </Button>
        </form>
      </article>
    </div>
  );
}
