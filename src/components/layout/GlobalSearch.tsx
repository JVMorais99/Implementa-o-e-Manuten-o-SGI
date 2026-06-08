"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResults } from "@/app/api/search/route";

type Group = { key: keyof SearchResults; label: string };
const GROUPS: Group[] = [
  { key: "clients", label: "Clientes" },
  { key: "projects", label: "Projetos" },
  { key: "requirements", label: "Requisitos" },
];

const EMPTY: SearchResults = { clients: [], projects: [], requirements: [] };

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Atalho ⌘K / Ctrl+K para focar a busca.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fecha ao clicar fora.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Busca com debounce (~250ms).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* abortado ou erro de rede — ignora */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const total =
    results.clients.length + results.projects.length + results.requirements.length;

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first =
      results.clients[0] ?? results.projects[0] ?? results.requirements[0];
    if (first) go(first.href);
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative max-w-xl flex-1">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente, projeto ou requisito"
          className="min-w-0 flex-1 bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"
          aria-label="Busca global"
        />
        <span className="ml-auto hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-400 sm:inline">
          ⌘ K
        </span>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
          {loading && total === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Buscando…</p>
          ) : total === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Nada encontrado.</p>
          ) : (
            GROUPS.map((g) => {
              const items = results[g.key];
              if (items.length === 0) return null;
              return (
                <div key={g.key} className="py-1">
                  <p className="px-4 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">
                    {g.label}
                  </p>
                  {items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => go(it.href)}
                      className="flex w-full flex-col items-start px-4 py-2 text-left transition hover:bg-gray-50"
                    >
                      <span className="line-clamp-1 text-sm font-medium text-gray-800">
                        {it.name}
                      </span>
                      {it.secondary && (
                        <span className="text-xs text-gray-400">{it.secondary}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
