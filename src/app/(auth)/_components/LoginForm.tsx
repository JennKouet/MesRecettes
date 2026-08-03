"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginInput } from "@/schemas/auth";
import { loginAction } from "@/server/actions/auth-actions";
import { FormRow, Input } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { applyServerErrors } from "./applyServerErrors";

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const result = await loginAction(values);
    if (!result.ok) {
      applyServerErrors(form, result);
      setServerError(result.fieldErrors ? null : result.message);
      return;
    }

    router.push("/recettes");
    // La session est posée en cookie côté serveur : sans refresh, les Server
    // Components déjà rendus (dont le header) resteraient sur l'état déconnecté.
    router.refresh();
  });

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

      <FormRow
        label="Adresse email"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          invalid={Boolean(form.formState.errors.email)}
          aria-describedby={form.formState.errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
      </FormRow>

      <FormRow
        label="Mot de passe"
        htmlFor="password"
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(form.formState.errors.password)}
          aria-describedby={
            form.formState.errors.password ? "password-error" : undefined
          }
          {...form.register("password")}
        />
      </FormRow>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
