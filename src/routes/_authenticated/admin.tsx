import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  ClipboardCheck,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { leaderRequestsQuery, reservationsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/lider" });
  },
  head: () => ({ meta: [{ title: "Administração — Liga UNI" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: reqs = [] } = useQuery(leaderRequestsQuery);
  const pendingResCount = res.filter((r) => r.status === "pending").length;
  const pendingReqCount = reqs.filter((r) => r.status === "pending").length;

  const nav = [
    { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
    { to: "/admin/cadastros", label: "Cadastros", icon: UserPlus, count: pendingReqCount },
    { to: "/admin/entidades", label: "Entidades", icon: Building2 },
    { to: "/admin/calendario", label: "Calendário", icon: CalendarDays },
    { to: "/admin/reservas", label: "Reservas", icon: ClipboardCheck, count: pendingResCount },
    { to: "/admin/salas", label: "Salas", icon: DoorOpen },
  ];

  return (
    <AppShell nav={nav} badge="Administrador" subtitle="Gestão do Ágora">
      <Outlet />
    </AppShell>
  );
}
