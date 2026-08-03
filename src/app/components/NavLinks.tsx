"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Recettes", href: "/recettes" },
  { label: "Menu", href: "/menu" },
] as const;

/**
 * Seul composant client du header : il a besoin de usePathname pour l'état actif.
 * Une seule liste responsive — l'ancien Header rendait les mêmes liens deux fois
 * (une version desktop et une version mobile).
 */
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex items-center gap-1">
        {LINKS.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn("nav-link", isActive && "nav-link-active")}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
