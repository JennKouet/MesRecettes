import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 fait tourner le typage et le build via Turbopack par défaut.
  // Aucune config webpack ici, donc rien à migrer.
  typedRoutes: true,
};

export default nextConfig;
