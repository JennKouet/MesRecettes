import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

// Polices auto-hébergées par next/font : pas de requête bloquante vers Google,
// pas de layout shift. Les variables CSS sont consommées par @theme dans globals.css.
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mes Recettes",
    template: "%s · Mes Recettes",
  },
  description:
    "Vos recettes de famille et vos menus de la semaine, au même endroit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-scroll-behavior est requis depuis Next 16 pour que le framework
    // neutralise le smooth scroll pendant les transitions de route.
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${oswald.variable} ${poppins.variable}`}
    >
      <body className="min-h-dvh bg-creme font-body text-encre antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-bordure bg-creme-100/70">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-sm text-encre-muted sm:px-6">
            <span>© {new Date().getFullYear()} Mes Recettes</span>
            <Link
              href={"/mentions-legales" as Route}
              className="underline underline-offset-2 hover:text-encre"
            >
              Mentions légales
            </Link>
            <Link
              href={"/confidentialite" as Route}
              className="underline underline-offset-2 hover:text-encre"
            >
              Politique de confidentialité
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
