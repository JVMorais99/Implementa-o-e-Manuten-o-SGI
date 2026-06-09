"use client";

import { useTransition } from "react";

// Seletor de consultor responsável. Chama a server action diretamente (arg simples,
// serializável) dentro de uma transition — sem <form>, pois o valor é o membershipId
// e não um FormData. Remonta ao mudar `current` (revalidação) via key no pai.
export function ResponsibleSelect({
  action,
  members,
  current,
  label,
}: {
  action: (membershipId: string | null) => Promise<void>;
  members: { id: string; name: string }[];
  current: string | null;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <label className="inline-flex items-center gap-2">
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <select
        defaultValue={current ?? ""}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value || null;
          startTransition(() => {
            void action(value);
          });
        }}
        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 transition focus:border-brand-500 focus:ring-brand-500 disabled:opacity-60"
      >
        <option value="">— Sem responsável —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-gray-400">salvando…</span>}
    </label>
  );
}
