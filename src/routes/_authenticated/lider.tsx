import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, DoorOpen, LayoutDashboard, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { myEntityQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lider")({
  beforeLoad: ({ context }) => {
    if (context.role === "admin") throw redirect({ to: "/admin" });
  },
  head: () => ({ meta: [{ title: "Painel do Líder — Liga UNI" }] }),
  component: LiderLayout,
});

const nav = [
  { to: "/lider", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/lider/equipe", label: "Equipe", icon: Users },
  { to: "/lider/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/lider/reservas", label: "Reservas", icon: DoorOpen },
];

function LiderLayout() {
  const { user } = Route.useRouteContext();
  const { data: entity } = useQuery(myEntityQuery(user.id));
  return (
    <AppShell nav={nav} badge="Líder" subtitle={entity?.nome ?? "Sem entidade cadastrada"}>
      <Outlet />
    </AppShell>
  );
}
