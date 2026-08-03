export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true">
      <div className="h-10 w-64 rounded-lg bg-creme-300" />
      <div className="grid gap-3 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-64 rounded-xl bg-creme-100" />
        ))}
      </div>
      <span className="sr-only">Chargement du menu…</span>
    </div>
  );
}
