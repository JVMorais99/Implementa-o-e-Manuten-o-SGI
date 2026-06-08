import {
  REQUIREMENT_STATUS_LABELS,
  type ProjectRequirementStatus,
} from "@/lib/enums";

// Cores (hex) alinhadas aos badges de status para o gráfico de rosca.
const STATUS_HEX: Record<string, string> = {
  NAO_INICIADO: "#9ca3af",
  SOLICITADO_CLIENTE: "#f59e0b",
  GERADO_SISTEMA: "#818cf8",
  ENVIADO_CLIENTE: "#38bdf8",
  RECEBIDO_CLIENTE: "#6366f1",
  EM_ANALISE: "#a855f7",
  CONFORME: "#10b981",
  PARCIAL: "#eab308",
  NAO_CONFORME: "#ef4444",
  NAO_APLICAVEL: "#cbd5e1",
};

export function StatusDonut({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(distribution).filter(([, n]) => n > 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = entries.map(([status, count]) => {
    const fraction = total > 0 ? count / total : 0;
    const length = fraction * circumference;
    const seg = {
      status,
      count,
      color: STATUS_HEX[status] ?? "#9ca3af",
      dash: `${length} ${circumference - length}`,
      offset: -offset,
    };
    offset += length;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {segments.map((s) => (
            <circle
              key={s.status}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-[11px] text-gray-400">requisitos</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {entries.length === 0 && (
          <li className="text-gray-400">Sem dados</li>
        )}
        {entries.map(([status, count]) => (
          <li key={status} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: STATUS_HEX[status] ?? "#9ca3af" }}
            />
            <span className="text-gray-600">
              {REQUIREMENT_STATUS_LABELS[status as ProjectRequirementStatus] ?? status}
            </span>
            <span className="font-semibold text-gray-800">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
