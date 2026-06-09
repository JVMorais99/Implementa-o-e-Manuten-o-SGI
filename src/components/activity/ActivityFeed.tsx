import { formatDateTime, initials } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/activity";

// Feed de atividades (accountability). Presentacional: recebe as entradas já
// escopadas/filtradas. Cada item mostra ator, o que fez e quando.
export function ActivityFeed({
  entries,
  showActor = true,
  emptyLabel = "Nenhuma atividade registrada ainda.",
}: {
  entries: ActivityEntry[];
  showActor?: boolean;
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-gray-400">{emptyLabel}</p>
    );
  }
  return (
    <ul className="divide-y divide-gray-50">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-3 px-5 py-3">
          {showActor && (
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600">
              {initials(e.actorName ?? "·")}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">
              {showActor && (
                <span className="font-semibold text-gray-800">
                  {e.actorName ?? "Sistema"}
                </span>
              )}{" "}
              {e.summary}
            </p>
            <p className="text-xs text-gray-400">{formatDateTime(e.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
