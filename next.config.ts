import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 fait tourner le typage et le build via Turbopack par défaut.
  // Aucune config webpack ici, donc rien à migrer.
  typedRoutes: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Chaque store Blob a son propre sous-domaine ; le motif les couvre tous.
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },

  experimental: {
    serverActions: {
      // Next plafonne les Server Actions à 1 Mo par défaut, ce qui rejetterait
      // la moindre photo. On monte à 4 Mo — juste sous la limite de 4,5 Mo des
      // fonctions Vercel, qu'on ne peut pas dépasser de toute façon.
      // Le composant d'envoi réduit l'image côté navigateur pour rester très
      // en dessous ; cette marge sert aux cas où cette réduction échoue.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
