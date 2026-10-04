import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function AppShell({
  nav,
  badge,
  subtitle,
  children,
}: {
  nav: NavItem[];
  badge: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="flex flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64">
        <div className="px-6 py-6">
          <div className="font-display text-xl font-bold">
            Liga <span className="text-sidebar-primary">UNI</span>
          </div>
          <span className="mt-3 inline-block rounded-full bg-sidebar-primary px-2.5 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
            {badge}
          </span>
          {subtitle && <p className="mt-2 truncate text-sm opacity-80">{subtitle}</p>}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: !!n.exact }}
              className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 transition hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent !opacity-100 font-semibold" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="m-3 hidden items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent md:flex"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <button onClick={signOut} className="mb-4 text-sm text-muted-foreground underline md:hidden">
          Sair
        </button>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

const statusMap = {
  pending: { label: "Pendente", cls: "bg-warning/20 text-warning-foreground" },
  approved: { label: "Aprovada", cls: "bg-success/15 text-success" },
  rejected: { label: "Recusada", cls: "bg-destructive/15 text-destructive" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusMap }) {
  const s = statusMap[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 shadow-card ${className}`}>{children}</div>;
}
