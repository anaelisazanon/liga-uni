import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Users } from "lucide-react";
import { Card, PageHeader, StatCard, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import {
  eventsQuery,
  membersQuery,
  myEntityQuery,
  myProfileQuery,
  reservationsQuery,
  roomsQuery,
} from "@/lib/data";
import { fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/")({
  component: LiderHome,
});

function LiderHome() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery(myProfileQuery(user.id));
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const id = entity?.id;
  const members = useQuery({ ...membersQuery(id), enabled: !!id });
  const events = useQuery({ ...eventsQuery(id), enabled: !!id });
  const res = useQuery({ ...reservationsQuery(id), enabled: !!id });
  const rooms = useQuery(roomsQuery);

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const allUpcoming = (events.data ?? []).filter((e) => new Date(e.fim) >= new Date());
  const upcoming = allUpcoming.slice(0, 5);
  const pending = (res.data ?? []).filter((r) => r.status === "pending").length;
  const roomName = (rid: string) => rooms.data?.find((r) => r.id === rid)?.nome ?? "Sala";
  const userName =
    profile?.nome || (user.user_metadata?.["nome"] as string | undefined) || user.email || "Líder";

  return (
    <>
      <PageHeader title={`Olá, ${userName}`} description={entity.nome} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Membros" value={members.data?.length ?? "–"} icon={Users} />
        <StatCard label="Próximos eventos" value={allUpcoming.length} icon={CalendarDays} />
        <StatCard label="Reservas pendentes" value={pending} icon={Clock} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex justify-between">
            <h3 className="font-semibold">Próximos eventos</h3>
            <Link to="/lider/calendario" className="text-sm text-primary">
              Ver tudo
            </Link>
          </div>
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
          )}
          <ul className="divide-y">
            {upcoming.map((e) => (
              <li key={e.id} className="py-2.5">
                <div className="font-medium">{e.titulo}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDateTime(e.inicio)} · {e.local || "Sem local"}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="mb-3 flex justify-between">
            <h3 className="font-semibold">Reservas recentes</h3>
            <Link to="/lider/reservas" className="text-sm text-primary">
              Ver tudo
            </Link>
          </div>
          {(res.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma reserva.</p>
          )}
          <ul className="divide-y">
            {(res.data ?? []).slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-medium">{roomName(r.room_id)}</div>
                  <div className="text-xs text-muted-foreground">{fmtDateTime(r.inicio)}</div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
