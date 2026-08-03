"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyPreviousWeek } from "@/server/actions/menu-actions";
import { Button } from "@/app/components/ui/Button";

export default function CopyPreviousWeek({ semaine }: { semaine: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function copy() {
    setMessage(null);
    startTransition(async () => {
      const result = await copyPreviousWeek(semaine);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(`${result.data.copied} repas repris.`);
      router.refresh();
    });
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      {message && (
        <p aria-live="polite" className="text-sm text-encre-muted">
          {message}
        </p>
      )}
      <Button variant="ghost" onClick={copy} disabled={isPending}>
        {isPending ? "Copie…" : "Reprendre la semaine précédente"}
      </Button>
    </div>
  );
}
