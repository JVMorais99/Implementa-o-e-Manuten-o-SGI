import Link from "next/link";
import { signOut } from "@/auth";
import { initials } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar({
  userName,
  userEmail,
  roleLabel = "Consultor",
  notificationCount = 0,
}: {
  userName: string;
  userEmail?: string | null;
  roleLabel?: string;
  notificationCount?: number;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="md:hidden flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
          ISO
        </div>
      </div>

      {/* Busca global funcional */}
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/notificacoes"
          aria-label={`Notificações${notificationCount ? ` (${notificationCount})` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2.5 border-l border-gray-100 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(userName)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-xs text-gray-400">{userEmail ?? roleLabel}</p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
