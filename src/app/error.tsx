"use client";

import { useEffect } from "react";
import { Button } from "./components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span aria-hidden className="text-4xl">
        🔥
      </span>
      <h1 className="text-2xl sm:text-3xl">Une erreur est survenue</h1>
      <p className="max-w-md text-encre-muted">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez — si le
        problème persiste, il faudra regarder les journaux du serveur.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-encre-faint">
          Référence : {error.digest}
        </p>
      )}
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
