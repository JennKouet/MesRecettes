/** Squelette affiché pendant le chargement de la liste (Neon peut être en veille). */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true">
      <div className="h-10 w-48 rounded-lg bg-creme-300" />
      <div className="h-11 rounded-lg bg-creme-300" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="card h-56 bg-creme-100" />
        ))}
      </ul>
      <span className="sr-only">Chargement des recettes…</span>
    </div>
  );
}
