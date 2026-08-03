import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn("btn", VARIANTS[variant], className);
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props} />
  );
}

/**
 * Même apparence qu'un bouton, mais c'est bien un lien de navigation.
 *
 * Générique sur `RouteType` : sans ça le wrapper effacerait le paramètre de type
 * de `Link` et `typedRoutes` refuserait toutes les routes dynamiques
 * (`/recettes/[slug]/modifier`, par exemple).
 */
export function ButtonLink<RouteType>({
  variant = "primary",
  className,
  ...props
}: LinkProps<RouteType> & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
