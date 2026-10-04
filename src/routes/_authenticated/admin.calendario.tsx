import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { MonthCalendar } from "@/components/MonthCalendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entitiesQuery, eventsQuery, reservationsQuery, roomsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  head: () => ({ meta: [{ title: "Calendário geral — Liga UNI" }] }),
  component: AdminCalendario,
});

function AdminCalendario() {
  const [filter, setFilter] = useState("all");
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: events = [] } = useQuery(eventsQuery());
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: rooms = [] } = useQuery(roomsQuery);
  const entName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "";
  const match = (id: string) => filter === "all" || filter === id;

  const items = [
    ...events.filter((e) => match(e.entity_id)).map((e) => ({ id: e.id, title: e.titulo, start: e.inicio, sub: entName(e.entity_id), tone: "event" as const })),
    ...res
      .filter((r) => r.status === "approved" && match(r.entity_id))
      .map((r) => ({ id: r.id, title: rooms.find((x) => x.id === r.room_id)?.nome ?? "Sala", start: r.inicio, sub: entName(r.entity_id), tone: "reservation" as const })),
  ];

  return (
    <>
      <PageHeader
        title="Calendário geral"
        description="Eventos e reservas aprovadas de todas as entidades"
        action={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {entities.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        }
      />
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/20" /> Evento</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent/40" /> Reserva de sala</span>
      </div>
      <MonthCalendar items={items} />
    </>
  );
}
