// ESLint flat config. `next lint` a été supprimé en Next 16 : on lance
// `eslint .` directement via `yarn lint`.
// eslint-config-next 16 exporte nativement des configs plates, donc pas de FlatCompat.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Client Prisma généré : jamais édité à la main.
      "src/generated/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
];

export default config;
