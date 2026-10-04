import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { MonthCalendar, type CalItem } from "@/components/MonthCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { entitiesQuery, eventsQuery, reservationsQuery, roomsQuery } from "@/lib/data";
import { fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  head: () => ({ meta: [{ title: "Calendário geral — Liga UNI" }] }),
  component: AdminCalendario,
});

function AdminCalendario() {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "event" | "reservation">("all");
  const [selected, setSelected] = useState<CalItem | null>(null);

  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: events = [] } = useQuery(eventsQuery());
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: rooms = [] } = useQuery(roomsQuery);
  const entName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "";
  const match = (id: string) => filter === "all" || filter === id;

  const eventItems: CalItem[] =
    typeFilter === "reservation"
      ? []
      : events
          .filter((e) => match(e.entity_id))
          .map((e) => ({
            id: `ev-${e.id}`,
            title: e.titulo,
            start: e.inicio,
            end: e.fim,
            sub: entName(e.entity_id),
            location: e.local || "Sem local informado",
            description: e.descricao || "Sem descrição",
            tone: "event" as const,
          }));

  const reservationItems: CalItem[] =
    typeFilter === "event"
      ? []
      : res
          .filter((r) => r.status === "approved" && match(r.entity_id))
          .map((r) => {
            const roomName = rooms.find((x) => x.id === r.room_id)?.nome ?? "Sala";
            return {
              id: `res-${r.id}`,
              title: roomName,
              start: r.inicio,
              end: r.fim,
              sub: entName(r.entity_id),
              location: roomName,
              description: r.motivo || "Sem motivo informado",
              tone: "reservation" as const,
            };
          });

  const items = [...eventItems, ...reservationItems];

  return (
    <>
      <PageHeader
        title="Calendário geral"
        description="Eventos e reservas aprovadas de todas as entidades"
        action={
          <div className="flex flex-wrap gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "all" | "event" | "reservation")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Eventos e reservas</SelectItem>
                <SelectItem value="event">Apenas eventos</SelectItem>
                <SelectItem value="reservation">Apenas reservas aprovadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary/20" /> Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent/40" /> Reserva de sala
        </span>
      </div>
      <MonthCalendar
        items={items}
        onItemClick={(id) => {
          const found = items.find((x) => x.id === id) ?? null;
          setSelected(found);
        }}
      />
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Tipo: </span>
                <span>
                  {selected.tone === "reservation"
                    ? "Reserva de sala aprovada"
                    : "Evento da entidade"}
                </span>
              </div>
              {selected.sub && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Entidade: </span>
                  <span className="font-medium">{selected.sub}</span>
                </div>
              )}
              {selected.location && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Local / Sala: </span>
                  <span>{selected.location}</span>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-muted-foreground">Horário: </span>
                <span>
                  {fmtDateTime(selected.start)}
                  {selected.end ? ` até ${fmtDateTime(selected.end)}` : ""}
                </span>
              </div>
              {selected.description && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Descrição / Motivo:
                  </div>
                  <p className="mt-1 rounded-lg border bg-muted/40 p-3 text-sm">
                    {selected.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
