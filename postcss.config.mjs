// Tailwind 4 : un seul plugin, qui intègre l'autoprefixing.
// `autoprefixer` et `postcss` ne sont plus des dépendances directes.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
