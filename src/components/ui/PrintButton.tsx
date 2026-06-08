"use client";

export function PrintButton({ label = "Imprimir / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 print:hidden"
    >
      {label}
    </button>
  );
}
