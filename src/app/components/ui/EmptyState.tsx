import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * État vide réutilisé à plusieurs endroits : aucune recette, aucun résultat de
 * recherche, semaine de menu vide, menu consulté sans être connecté.
 */
export default function EmptyState({
  icon = "🍽️",
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card flex flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span aria-hidden className="text-4xl">
        {icon}
      </span>
      <h2 className="text-xl sm:text-2xl">{title}</h2>
      {description && (
        <p className="max-w-md text-encre-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
