import type { ComponentProps } from "react";
import type { TagKind } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

/**
 * Couleur pilotée par la famille du tag, pour que « Dessert » et « Végétarien »
 * ne se ressemblent pas. safran-700 (et non 500) pour rester lisible sur fond clair.
 */
const KIND_STYLES: Record<TagKind, string> = {
  COURSE: "bg-tomate-50 text-tomate-700 border-tomate-200",
  DIET: "bg-basilic-100 text-basilic-700 border-basilic-300",
  CUISINE: "bg-safran-100 text-safran-700 border-safran-300",
  OTHER: "bg-creme-100 text-encre-muted border-bordure",
};

const BASE =
  "inline-flex items-center rounded-full border px-2.5 py-1 font-title text-xs font-semibold tracking-wide uppercase no-underline";

export function TagPill({
  name,
  kind,
  className,
}: {
  name: string;
  kind: TagKind;
  className?: string;
}) {
  return <span className={cn(BASE, KIND_STYLES[kind], className)}>{name}</span>;
}

/** Variante interactive utilisée par les filtres de la liste. */
export function TagPillButton({
  name,
  kind,
  active,
  className,
  ...props
}: ComponentProps<"button"> & {
  name: string;
  kind: TagKind;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        BASE,
        "cursor-pointer transition",
        active
          ? "border-tomate-500 bg-tomate-500 text-white"
          : cn(KIND_STYLES[kind], "hover:border-tomate-400"),
        className,
      )}
      {...props}
    >
      {name}
    </button>
  );
}
