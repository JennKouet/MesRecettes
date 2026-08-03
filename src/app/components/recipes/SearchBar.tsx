"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/Field";
import { withQuery } from "@/lib/routes";

/**
 * Recherche pilotée par l'URL : l'état vit dans `?q=`, pas dans un state React.
 * La page reste ainsi un Server Component, partageable et rechargeable.
 *
 * L'input est contrôlé localement uniquement pour la fluidité de frappe ;
 * l'URL n'est mise à jour qu'après une pause (debounce).
 */
export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const isFirstRender = useRef(true);

  // Resynchronisation quand l'URL change depuis l'extérieur (retour arrière du
  // navigateur, réinitialisation des filtres).
  //
  // C'est un ajustement d'état PENDANT le rendu, pas dans un useEffect : React
  // recommande explicitement ce motif pour de l'état dérivé, parce qu'il
  // re-rend immédiatement sans repasser par le DOM — là où un effet
  // provoquerait un rendu en cascade avec un affichage intermédiaire faux.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => {
    // Ne pas repousser une navigation au montage : ça écraserait l'URL initiale.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (value === urlQuery) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.replace(withQuery(pathname, params), { scroll: false });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, urlQuery, pathname, router, searchParams]);

  return (
    <div>
      <label htmlFor="recipe-search" className="sr-only">
        Rechercher une recette
      </label>
      <Input
        id="recipe-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Rechercher une recette…"
      />
    </div>
  );
}
