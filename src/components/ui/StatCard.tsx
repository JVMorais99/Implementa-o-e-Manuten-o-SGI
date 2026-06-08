import { cn } from "@/lib/utils";

export type StatDelta = {
  /** Texto exibido na pílula, ex.: "6%" ou "1". */
  label: string;
  direction: "up" | "down";
  /** Se a variação é positiva para o negócio (verde) ou não (vermelho). */
  tone?: "good" | "bad";
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  delta,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
  delta?: StatDelta;
  /** @deprecated mantido por compatibilidade; o ícone agora é neutro. */
  accent?: "brand" | "emerald" | "amber" | "rose" | "sky";
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-3 flex items-end gap-2.5">
        <p className="text-3xl font-bold leading-none tracking-tight text-gray-800">
          {value}
        </p>
        {unit && <p className="mb-0.5 text-xs font-medium text-gray-400">{unit}</p>}
        {delta && (
          <span
            className={cn(
              "mb-0.5 ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta.tone === "bad"
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.label}
          </span>
        )}
      </div>
      {hint && <p className="mt-2.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-gray-100", className)}>
      <div
        className="h-1.5 rounded-full bg-brand-600 transition-all"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
