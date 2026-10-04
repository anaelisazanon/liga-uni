import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  MapPin,
  Users,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AppShell";
import { MonthCalendar, type CalItem } from "@/components/MonthCalendar";
import { NeedEntity } from "@/components/NeedEntity";
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
  eventsQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";
import { fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Liga UNI" }] }),
  component: CalendarioPage,
});

type LeaderCalDetail = CalItem & {
  categoryLabel: string;
  participantsText?: string;
  status?: "pending" | "approved" | "rejected";
  editTo: string;
  editSearch?: { tab?: string };
  editLabel: string;
};

type FilterType =
  | "all"
  | "reuniao_uni"
  | "capacitacao"
  | "staff"
  | "oficina"
  | "reservation";

function CalendarioPage() {
  const { user } = Route.useRouteContext();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const entityId = entity?.id;

  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<LeaderCalDetail | null>(null);

  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: myAttendances = [] } = useQuery({
    ...meetingAttendancesQuery(entityId),
    enabled: !!entityId,
  });
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: myTrainingRegs = [] } = useQuery({
    ...trainingRegistrationsQuery(entityId),
    enabled: !!entityId,
  });
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: myStaffVols = [] } = useQuery({
    ...staffVolunteersQuery(entityId),
    enabled: !!entityId,
  });
  const { data: workshops = [] } = useQuery({
    ...peerWorkshopsQuery(entityId),
    enabled: !!entityId,
  });
  const { data: reservations = [] } = useQuery({
    ...reservationsQuery(entityId),
    enabled: !!entityId,
  });
  const { data: events = [] } = useQuery({
    ...eventsQuery(entityId),
    enabled: !!entityId,
  });
  const { data: rooms = [] } = useQuery(roomsQuery);

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const roomName = (rid?: string | null) =>
    rid ? (rooms.find((r) => r.id === rid)?.nome ?? "Sala do Ágora") : "Sala do Ágora";

  const meetingItems: LeaderCalDetail[] = meetings
    .filter((m) => m.ativa)
    .map((m) => {
      const att = myAttendances.find((a) => a.meeting_id === m.id && a.presente);
      return {
        id: `gm-${m.id}`,
        title: m.titulo,
        start: m.inicio,
        end: m.fim,
        sub: "Reunião Liga UNI",
        location: m.local,
        description: m.pauta,
        tone: "reuniao_uni",
        enrolled: Boolean(att),
        categoryLabel: "Reunião Liga UNI",
        participantsText: att ? att.representantes : undefined,
        editTo: "/lider/reunioes",
        editLabel: "Reuniões Liga UNI",
      };
    });

  const trainingItems: LeaderCalDetail[] = trainings
    .filter((t) => t.ativa)
    .map((t) => {
      const reg = myTrainingRegs.find((r) => r.training_id === t.id);
      return {
        id: `tr-${t.id}`,
        title: t.titulo,
        start: t.inicio,
        end: t.fim,
        sub: "Capacitação UNI",
        location: t.local,
        description: t.descricao,
        tone: "capacitacao",
        enrolled: Boolean(reg),
        categoryLabel: "Capacitação UNI",
        participantsText: reg ? reg.participantes : undefined,
        editTo: "/lider/capacitacoes",
        editSearch: { tab: "capacitacoes" },
        editLabel: "Capacitações UNI",
      };
    });

  const staffItems: LeaderCalDetail[] = staffCalls
    .filter((c) => c.ativa)
    .map((c) => {
      const vol = myStaffVols.find((v) => v.call_id === c.id);
      return {
        id: `sc-${c.id}`,
        title: c.evento,
        start: c.inicio,
        end: c.fim,
        sub: "Staff em Evento",
        location: c.local,
        description: c.descricao,
        tone: "staff",
        enrolled: Boolean(vol),
        categoryLabel: "Auxílio de Staff em Evento",
        participantsText: vol ? vol.participantes : undefined,
        editTo: "/lider/capacitacoes",
        editSearch: { tab: "staff" },
        editLabel: "Staff em Eventos",
      };
    });

  const workshopItems: LeaderCalDetail[] = workshops
    .filter((w) => w.status !== "rejected")
    .map((w) => ({
      id: `pw-${w.id}`,
      title: w.titulo,
      start: w.data_sugerida,
      end: w.fim || w.data_sugerida,
      sub: "Oficina entre Equipes",
      location: roomName(w.room_id),
      description: w.descricao,
      tone: "oficina",
      enrolled: true,
      status: w.status,
      categoryLabel: "Oficina Oferecida pela Equipe",
      participantsText: w.ministrantes,
      editTo: "/lider/capacitacoes",
      editSearch: { tab: "oficinas" },
      editLabel: "Oferecer Oficina",
    }));

  const reservationItems: LeaderCalDetail[] = reservations
    .filter((r) => r.status !== "rejected" && r.purpose !== "capacitacao_geral")
    .map((r) => {
      const rName = roomName(r.room_id);
      return {
        id: `res-${r.id}`,
        title: `Reunião: ${rName}`,
        start: r.inicio,
        end: r.fim,
        sub: "Reunião de Equipe",
        location: rName,
        description: r.motivo || "Reunião interna da equipe",
        tone: "reservation",
        enrolled: r.status === "approved",
        status: r.status,
        categoryLabel: "Reunião de Equipe (Reserva de Sala)",
        editTo: "/lider/capacitacoes",
        editSearch: { tab: "reunioes-equipe" },
        editLabel: "Reuniões de Equipe",
      };
    });

  const eventItems: LeaderCalDetail[] = events.map((e) => ({
    id: `ev-${e.id}`,
    title: e.titulo,
    start: e.inicio,
    end: e.fim,
    sub: "Atividade da Equipe",
    location: e.local || "Ágora Tech Park",
    description: e.descricao || "Atividade agendada pela equipe",
    tone: "reservation",
    enrolled: true,
    categoryLabel: "Reunião / Atividade da Equipe",
    editTo: "/lider/capacitacoes",
    editSearch: { tab: "reunioes-equipe" },
    editLabel: "Reuniões de Equipe",
  }));

  const allItems: LeaderCalDetail[] = [
    ...meetingItems,
    ...trainingItems,
    ...staffItems,
    ...workshopItems,
    ...reservationItems,
    ...eventItems,
  ];

  const filteredItems =
    typeFilter === "all" ? allItems : allItems.filter((it) => it.tone === typeFilter);

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Visão geral de todas as atividades do Liga UNI e da sua equipe (modo somente visualização)"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" /> Modo visualização
            </span>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as FilterType)}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as atividades</SelectItem>
                <SelectItem value="reuniao_uni">Reuniões Liga UNI</SelectItem>
                <SelectItem value="capacitacao">Capacitações UNI</SelectItem>
                <SelectItem value="staff">Staff em Eventos</SelectItem>
                <SelectItem value="oficina">Oficinas entre Equipes</SelectItem>
                <SelectItem value="reservation">Reuniões de Equipe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-500/40 bg-amber-500/20" /> Reunião
          Liga UNI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-primary/30 bg-primary/20" /> Capacitação
          UNI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-accent/50 bg-accent/30" /> Staff em Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-success/40 bg-success/20" /> Oficina
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-secondary" /> Reunião de Equipe
        </span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> = Equipe inscrita
        </span>
      </div>

      <MonthCalendar
        items={filteredItems}
        onItemClick={(id) => {
          const found = filteredItems.find((x) => x.id === id) ?? null;
          setSelected(found);
        }}
      />

      {/* Modal somente visualização com botão direcionando para a página da atividade */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {selected?.categoryLabel}
              </span>
              {selected?.enrolled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                  <CheckCircle2 className="h-3 w-3" /> Inscrito
                </span>
              )}
              {selected?.status && <StatusBadge status={selected.status} />}
            </div>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3.5 text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <b>Horário:</b> {fmtDateTime(selected.start)}
                    {selected.end ? ` até ${fmtDateTime(selected.end)}` : ""}
                  </span>
                </div>
                {selected.location && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <b>Local / Sala:</b> {selected.location}
                    </span>
                  </div>
                )}
              </div>

              {selected.description && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Descrição / Pauta:
                  </div>
                  <p className="mt-1 rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              )}

              {selected.participantsText && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Users className="h-3.5 w-3.5" /> Membros da equipe inscritos:
                  </div>
                  <p className="mt-1 text-foreground">{selected.participantsText}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Fechar visualização
                </Button>
                <Button asChild>
                  <Link
                    to={selected.editTo}
                    search={selected.editSearch}
                    onClick={() => setSelected(null)}
                  >
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
