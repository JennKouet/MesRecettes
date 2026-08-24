export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl animate-pulse flex-col gap-6"
      aria-busy="true"
    >
      <div className="h-10 w-64 rounded-lg bg-creme-300" />
      <div className="h-12 rounded-lg bg-creme-100" />
      <div className="h-64 rounded-xl bg-creme-100" />
      <span className="sr-only">Chargement de la liste de courses…</span>
    </div>
  );
}
