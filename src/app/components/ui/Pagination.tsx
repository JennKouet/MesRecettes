import Link from "next/link";
import type { Route } from "next";
import { buttonClasses } from "./Button";
import { cn } from "@/lib/cn";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Reconstruit l'URL d'une page en conservant les filtres actifs (`q`, `tag`…).
 * `page=1` est omis pour garder l'URL de la première page propre.
 */
function hrefForPage(basePath: string, searchParams: SearchParams, page: number): Route {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }

  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return (query ? `${basePath}?${query}` : basePath) as Route;
}

export default function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={hrefForPage(basePath, searchParams, page - 1)} className={buttonClasses("ghost")}>
          ← Précédente
        </Link>
      ) : (
        <span aria-disabled className={cn(buttonClasses("ghost"), "pointer-events-none opacity-40")}>
          ← Précédente
        </span>
      )}

      <span className="text-sm text-encre-muted">
        Page {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefForPage(basePath, searchParams, page + 1)} className={buttonClasses("ghost")}>
          Suivante →
        </Link>
      ) : (
        <span aria-disabled className={cn(buttonClasses("ghost"), "pointer-events-none opacity-40")}>
          Suivante →
        </span>
      )}
    </nav>
  );
}
