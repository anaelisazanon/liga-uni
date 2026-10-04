import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Building2, CalendarDays, DoorOpen, LayoutDashboard, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/lider" });
  },
  head: () => ({ meta: [{ title: "Administração — Liga UNI" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/entidades", label: "Entidades", icon: Building2 },
  { to: "/admin/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/admin/reservas", label: "Reservas", icon: ClipboardCheck },
  { to: "/admin/salas", label: "Salas", icon: DoorOpen },
];

function AdminLayout() {
  return (
    <AppShell nav={nav} badge="Administrador" subtitle="Gestão do Ágora">
      <Outlet />
    </AppShell>
  );
}
