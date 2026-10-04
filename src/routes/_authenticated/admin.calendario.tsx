import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Eye } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { MonthCalendar, type CalItem } from "@/components/MonthCalendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  entitiesQuery,
  eventsQuery,
  generalMeetingsQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  roomsQuery,
  staffCallsQuery,
  trainingsQuery,
} from "@/lib/data";
import { fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  head: () => ({ meta: [{ title: "Calendário geral — Liga UNI" }] }),
  component: AdminCalendario,
});

type AdminCalDetail = CalItem & {
  categoryLabel: string;
  editTo: string;
  editLabel: string;
};

function AdminCalendario() {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "event" | "reservation" | "liga">("all");
  const [selected, setSelected] = useState<AdminCalDetail | null>(null);

  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: events = [] } = useQuery(eventsQuery());
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());

  const entName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "";
  const match = (id: string) => filter === "all" || filter === id;

  const eventItems: AdminCalDetail[] =
    typeFilter === "reservation" || typeFilter === "liga"
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
            categoryLabel: "Evento da entidade",
            editTo: "/admin/entidades",
            editLabel: "Entidades & Líderes",
          }));

  const reservationItems: AdminCalDetail[] =
    typeFilter === "event" || typeFilter === "liga"
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
              categoryLabel: "Reserva de sala aprovada",
              editTo: "/admin/reservas",
              editLabel: "Salas do Ágora",
            };
          });

  const ligaItems: AdminCalDetail[] =
    typeFilter === "event" || typeFilter === "reservation" || filter !== "all"
      ? []
      : [
          ...meetings
            .filter((m) => m.ativa)
            .map((m) => ({
              id: `gm-${m.id}`,
              title: m.titulo,
              start: m.inicio,
              end: m.fim,
              sub: "Reunião Liga UNI",
              location: m.local,
              description: m.pauta,
              tone: "reuniao_uni" as const,
              categoryLabel: "Reunião Liga UNI",
              editTo: "/admin/capacitacoes",
              editLabel: "Reuniões, Capacitações & Staff",
            })),
          ...trainings
            .filter((t) => t.ativa)
            .map((t) => ({
              id: `tr-${t.id}`,
              title: t.titulo,
              start: t.inicio,
              end: t.fim,
              sub: "Capacitação UNI",
              location: t.local,
              description: t.descricao,
              tone: "capacitacao" as const,
              categoryLabel: "Capacitação UNI",
              editTo: "/admin/capacitacoes",
              editLabel: "Reuniões, Capacitações & Staff",
            })),
          ...staffCalls
            .filter((c) => c.ativa)
            .map((c) => ({
              id: `sc-${c.id}`,
              title: c.evento,
              start: c.inicio,
              end: c.fim,
              sub: "Staff em Evento",
              location: c.local,
              description: c.descricao,
              tone: "staff" as const,
              categoryLabel: "Staff em Evento",
              editTo: "/admin/capacitacoes",
              editLabel: "Reuniões, Capacitações & Staff",
            })),
          ...workshops
            .filter((w) => w.status === "approved")
            .map((w) => {
              const roomName = rooms.find((x) => x.id === w.room_id)?.nome ?? "Sala do Ágora";
              return {
                id: `pw-${w.id}`,
                title: w.titulo,
                start: w.data_sugerida,
                end: w.fim || w.data_sugerida,
                sub: entName(w.entity_id),
                location: roomName,
                description: w.descricao,
                tone: "oficina" as const,
                categoryLabel: "Oficina entre Equipes",
                editTo: "/admin/capacitacoes",
                editLabel: "Reuniões, Capacitações & Staff",
              };
            }),
        ];

  const items = [...ligaItems, ...eventItems, ...reservationItems];

  return (
    <>
      <PageHeader
        title="Calendário geral"
        description="Atividades oficiais, eventos e reservas aprovadas (modo somente visualização)"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" /> Modo visualização
            </span>
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as "all" | "event" | "reservation" | "liga")
              }
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as atividades</SelectItem>
                <SelectItem value="liga">Reuniões, Capacitações & Staff</SelectItem>
                <SelectItem value="reservation">Apenas reservas aprovadas</SelectItem>
                <SelectItem value="event">Apenas eventos de equipes</SelectItem>
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
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-500/40 bg-amber-500/20" /> Reunião
          Liga UNI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-primary/30 bg-primary/20" /> Capacitação /
          Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-accent/50 bg-accent/30" /> Staff
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-success/40 bg-success/20" /> Oficina
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-secondary" /> Reserva de sala
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
                <span>{selected.categoryLabel}</span>
              </div>
              {selected.sub && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Origem: </span>
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
              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Fechar visualização
                </Button>
                <Button asChild>
                  <Link to={selected.editTo} onClick={() => setSelected(null)}>
                    Ir para {selected.editLabel} para editar
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
