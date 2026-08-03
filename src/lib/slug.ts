/**
 * « Tarte aux pommes & cannelle » → « tarte-aux-pommes-cannelle »
 *
 * La normalisation NFD suivie du retrait des diacritiques transforme « é » en
 * « e » plutôt que de le supprimer.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Rend un slug unique en lui ajoutant un suffixe numérique si besoin.
 *
 * `isTaken` est injecté plutôt que d'appeler la base ici : ça garde ce module
 * pur et testable, et permet à l'appelant d'exclure la recette en cours
 * d'édition de la vérification.
 */
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "recette";

  if (!(await isTaken(root))) return root;

  for (let suffix = 2; suffix < 200; suffix++) {
    const candidate = `${root}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // Garde-fou : en pratique inatteignable.
  return `${root}-${Date.now()}`;
}
