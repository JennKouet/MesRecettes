import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
