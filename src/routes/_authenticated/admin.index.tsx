import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, Clock, DoorOpen, UserPlus, Users } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/AppShell";
import {
  entitiesQuery,
  eventsQuery,
  leaderRequestsQuery,
  membersQuery,
  reservationsQuery,
  roomsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const e = useQuery(entitiesQuery);
  const m = useQuery(membersQuery());
  const ev = useQuery(eventsQuery());
  const r = useQuery(reservationsQuery());
  const reqs = useQuery(leaderRequestsQuery);
  const rooms = useQuery(roomsQuery);

  const pendingRes = (r.data ?? []).filter((x) => x.status === "pending").length;
  const pendingReqs = (reqs.data ?? []).filter((x) => x.status === "pending").length;

  return (
    <>
      <PageHeader title="Visão geral" description="Métricas do sistema" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Entidades" value={e.data?.length ?? "–"} icon={Building2} />
        <StatCard label="Membros" value={m.data?.length ?? "–"} icon={Users} />
        <StatCard label="Eventos" value={ev.data?.length ?? "–"} icon={CalendarDays} />
        <StatCard
          label="Salas ativas"
          value={rooms.data?.filter((x) => x.ativa).length ?? "–"}
          icon={DoorOpen}
        />
        <StatCard label="Reservas pendentes" value={pendingRes} icon={Clock} />
        <StatCard label="Cadastros pendentes" value={pendingReqs} icon={UserPlus} />
      </div>
      <div className="mt-8 space-y-4">
        {pendingReqs > 0 && (
          <Card className="flex items-center justify-between">
            <p>
              Há <b>{pendingReqs}</b> solicitação(ões) de cadastro de líder/projeto aguardando
              aprovação.
            </p>
            <Link to="/admin/cadastros" className="font-semibold text-primary">
              Analisar cadastros
            </Link>
          </Card>
        )}
        {pendingRes > 0 && (
          <Card className="flex items-center justify-between">
            <p>
              Há <b>{pendingRes}</b> solicitação(ões) de reserva aguardando análise.
            </p>
            <Link to="/admin/reservas" className="font-semibold text-primary">
              Analisar reservas
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
