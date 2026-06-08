"use client";

import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "ghost";

function Inner({
  label,
  pendingLabel,
  variant,
  size,
}: {
  label: string;
  pendingLabel: string;
  variant: Variant;
  size: "md" | "sm";
}) {
  const { pending } = useFormStatus();
  const sizing = size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm";
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : variant === "secondary"
      ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
      : "text-gray-500 hover:text-brand-600";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg font-semibold transition disabled:opacity-60 ${sizing} ${styles}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

// Botão que dispara uma server action simples (sem formData), com estado de envio.
export function AuditActionButton({
  action,
  label,
  pendingLabel = "Salvando...",
  variant = "secondary",
  size = "md",
  confirmMessage,
}: {
  action: () => Promise<void>;
  label: string;
  pendingLabel?: string;
  variant?: Variant;
  size?: "md" | "sm";
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Inner
        label={label}
        pendingLabel={pendingLabel}
        variant={variant}
        size={size}
      />
    </form>
  );
}
