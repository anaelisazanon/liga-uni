import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, Clock, DoorOpen, Users } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/AppShell";
import { entitiesQuery, eventsQuery, membersQuery, reservationsQuery, roomsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const e = useQuery(entitiesQuery);
  const m = useQuery(membersQuery());
  const ev = useQuery(eventsQuery());
  const r = useQuery(reservationsQuery());
  const rooms = useQuery(roomsQuery);
  const pending = (r.data ?? []).filter((x) => x.status === "pending").length;

  return (
    <>
      <PageHeader title="Visão geral" description="Métricas do sistema" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Entidades" value={e.data?.length ?? "–"} icon={Building2} />
        <StatCard label="Membros" value={m.data?.length ?? "–"} icon={Users} />
        <StatCard label="Eventos" value={ev.data?.length ?? "–"} icon={CalendarDays} />
        <StatCard label="Salas ativas" value={rooms.data?.filter((x) => x.ativa).length ?? "–"} icon={DoorOpen} />
        <StatCard label="Pendentes" value={pending} icon={Clock} />
      </div>
      {pending > 0 && (
        <Card className="mt-8 flex items-center justify-between">
          <p>Há <b>{pending}</b> solicitação(ões) de reserva aguardando análise.</p>
          <Link to="/admin/reservas" className="font-semibold text-primary">Analisar</Link>
        </Card>
      )}
    </>
  );
}
