import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L'Atelier des Épicuriens",
    short_name: "Épicuriens",
    description: "Un atelier pour vos recettes, un menu pour votre semaine.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffcf6",
    theme_color: "#c9502f",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
