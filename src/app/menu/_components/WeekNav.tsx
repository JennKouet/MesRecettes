"use client";

import { addWeeks, subWeeks } from "date-fns";
import { useRouter } from "next/navigation";
import { formatWeekLabel, toWeekStart, weekParam } from "@/lib/week";
import { withQuery } from "@/lib/routes";
import { Button } from "@/app/components/ui/Button";

export default function WeekNav({
  weekStart,
  basePath = "/menu",
}: {
  weekStart: Date;
  basePath?: "/menu" | "/courses";
}) {
  const router = useRouter();

  function goTo(target: Date) {
    router.push(
      withQuery(basePath, new URLSearchParams({ semaine: weekParam(target) })),
    );
  }

  const isCurrentWeek = weekParam(weekStart) === weekParam(toWeekStart(new Date()));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          aria-label="Semaine précédente"
          onClick={() => goTo(subWeeks(weekStart, 1))}
        >
          <span aria-hidden>←</span>
        </Button>
        <Button
          variant="ghost"
          aria-label="Semaine suivante"
          onClick={() => goTo(addWeeks(weekStart, 1))}
        >
          <span aria-hidden>→</span>
        </Button>
      </div>

      <p aria-live="polite" className="font-title font-semibold first-letter:uppercase">
        {formatWeekLabel(weekStart)}
      </p>

      {!isCurrentWeek && (
        <Button
          variant="ghost"
          onClick={() => goTo(toWeekStart(new Date()))}
          className="ml-auto"
        >
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  );
}
