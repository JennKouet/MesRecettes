import type { Route } from "next";

/**
 * Recompose « chemin + query » pour router.push / router.replace.
 *
 * `typedRoutes` sait valider `/recettes?q=x` écrit en dur, mais pas une query
 * assemblée à l'exécution. Le cast est isolé ici, à un seul endroit et commenté,
 * plutôt que dispersé dans chaque composant de filtre — le chemin, lui, vient
 * toujours de `usePathname()`, donc il est forcément réel.
 */
export function withQuery(pathname: string, params: URLSearchParams): Route {
  const query = params.toString();
  return (query ? `${pathname}?${query}` : pathname) as Route;
}
