"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/enums";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  roles: OrgRole[];
};

type NavSection = { label: string; items: NavItem[] };

// Navegação agrupada por seção (estilo Vesper), preservando os papéis que
// enxergam cada item.
const SECTIONS: NavSection[] = [
  {
    label: "Geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: IconDashboard, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR", "CLIENTE"] },
      { href: "/clientes", label: "Clientes", icon: IconClients, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR"] },
      { href: "/projetos", label: "Projetos", icon: IconProjects, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR", "CLIENTE"] },
      { href: "/notificacoes", label: "Notificações", icon: IconBell, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR", "CLIENTE"] },
    ],
  },
  {
    label: "Módulos",
    items: [
      { href: "/auditorias", label: "Auditorias", icon: IconAudits, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR"] },
      { href: "/relatorios", label: "Relatórios", icon: IconReports, roles: ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR"] },
    ],
  },
  {
    label: "Suporte",
    items: [
      { href: "/equipe", label: "Equipe", icon: IconTeam, roles: ["ADMIN"] },
      { href: "/configuracoes", label: "Configurações", icon: IconSettings, roles: ["ADMIN", "CONSULTOR"] },
    ],
  },
];

export function Sidebar({ role }: { role: OrgRole }) {
  const pathname = usePathname();
  const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((item) => item.roles.includes(role)),
  })).filter((s) => s.items.length > 0);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-100 bg-white px-3.5 md:flex">
      <div className="flex items-center gap-2.5 px-2.5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
            <path
              d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 12l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-[17px] font-bold tracking-tight text-gray-800">ISO SGI</p>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition",
                      active
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", active ? "text-gray-800" : "text-gray-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconClients({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 11a3 3 0 100-6M21 20a6 6 0 00-5-5.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconProjects({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconAudits({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 4h6a1 1 0 011 1v1h2a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h2V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTeam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19a4.5 4.5 0 019 0M11.5 19a4.5 4.5 0 019 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconReports({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3h9l5 5v13a0 0 0 01 0 0H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1l-.4-2.6h-4l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.6h4l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5c.07-.33.1-.66.1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
