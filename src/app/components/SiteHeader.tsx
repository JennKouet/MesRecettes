import Link from "next/link";
import NavLinks from "./NavLinks";
import AuthMenu from "./AuthMenu";

/**
 * Server Component.
 *
 * La marque est un <Link>, pas un <h1> : l'ancien Header plaçait le titre du site
 * dans un <h1> à l'intérieur du <nav>, ce qui donnait deux <h1> sur chaque page.
 * Chaque page possède désormais son unique <h1>.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-creme/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="nav-brand text-lg leading-tight sm:text-xl"
        >
          L&apos;Atelier des Épicuriens
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <NavLinks />
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
