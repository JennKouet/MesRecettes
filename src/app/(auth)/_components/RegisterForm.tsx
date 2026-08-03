"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "@/server/actions/auth-actions";
import { FormRow, Input } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { applyServerErrors } from "./applyServerErrors";

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const result = await registerAction(values);
    if (!result.ok) {
      const handled = applyServerErrors(form, result);
      if (!handled) setServerError(result.message);
      return;
    }

    // registerAction connecte automatiquement l'utilisateur créé.
    router.push("/recettes");
    router.refresh();
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-tomate-200 bg-tomate-50 px-3 py-2 text-sm text-tomate-700"
        >
          {serverError}
        </p>
      )}

      <FormRow label="Nom" htmlFor="name" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Jenny"
          invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...form.register("name")}
        />
      </FormRow>

      <FormRow label="Adresse email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
      </FormRow>

      <FormRow
        label="Mot de passe"
        htmlFor="password"
        error={errors.password?.message}
        hint="Au moins 10 caractères, avec une lettre et un chiffre."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "password-error" : "password-hint"
          }
          {...form.register("password")}
        />
      </FormRow>

      <FormRow
        label="Confirmer le mot de passe"
        htmlFor="confirm"
        error={errors.confirm?.message}
      >
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? "confirm-error" : undefined}
          {...form.register("confirm")}
        />
      </FormRow>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
