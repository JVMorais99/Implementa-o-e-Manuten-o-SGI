import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

// Primitivos de tabela "Vesper" (claro, plano, denso). Padronizam o look usado no
// dashboard para todas as listas do app.

// Card sem padding com cabeçalho opcional — embrulha uma <Table>.
export function TableCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-y border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-5 py-2.5 font-semibold",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-gray-50 transition last:border-0 hover:bg-gray-50/60",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "px-5 py-3 text-sm text-gray-600",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

// Célula de identidade: avatar (iniciais) + nome + linha secundária opcional.
export function AvatarCell({
  name,
  secondary,
}: {
  name: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">
        {initials(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-gray-800">{name}</span>
        {secondary && <span className="block truncate text-xs text-gray-400">{secondary}</span>}
      </span>
    </div>
  );
}
