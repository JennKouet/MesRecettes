import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Champs de formulaire.
 *
 * React 19 accepte `ref` comme prop normale : plus besoin de forwardRef pour
 * recevoir le `ref` que react-hook-form passe via `register()`.
 */

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cn("field", invalid && "field-error", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn("field", invalid && "field-error", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      className={cn("field", invalid && "field-error", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-title text-sm font-semibold tracking-wide text-encre-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

/** Message d'erreur de champ. `aria-live` pour que les lecteurs d'écran l'annoncent. */
export function FieldError({
  id,
  children,
}: {
  id?: string;
  children?: ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" aria-live="polite" className="mt-1.5 text-sm text-tomate-700">
      {children}
    </p>
  );
}

/** Groupe label + champ + erreur, avec le câblage aria-describedby. */
export function FormRow({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-sm text-encre-faint">
          {hint}
        </p>
      )}
      <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
    </div>
  );
}
