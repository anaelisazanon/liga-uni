import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { PageHeader, StatCard, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/auth";
import {
  adminMessagesQuery,
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  calculateSemesterRequirements,
  countParticipants,
  CURRENT_SEMESTER_LABEL,
  entitiesQuery,
  generalMeetingsQuery,
  leaderRequestsQuery,
  meetingAttendancesQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  rewardRedemptionsQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: reservations = [] } = useQuery(reservationsQuery());
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: calls = [] } = useQuery(staffCallsQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: volunteers = [] } = useQuery(staffVolunteersQuery());
  const { data: redemptions = [] } = useQuery(rewardRedemptionsQuery());
  const { data: leaderReqs = [] } = useQuery(leaderRequestsQuery);
  const { data: tickets = [] } = useQuery(adminMessagesQuery());

  const entityName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "Entidade";
  const roomName = (id?: string | null) =>
    id ? (rooms.find((r) => r.id === id)?.nome ?? "Sala") : "Sala";

  const pendingRes = reservations.filter((r) => r.status === "pending");
  const pendingWorkshops = workshops.filter(
    (w) => w.status === "pending" || (w.status === "approved" && !w.moedas_liberadas),
  );
  const pendingStaffCoins = volunteers.filter((v) => !v.moedas_liberadas);
  const pendingTrainingCoins = trainingRegs.filter((r) => !r.moedas_liberadas);
  const pendingMeetingCoins = attendances.filter((a) => a.presente && !a.moedas_liberadas);
  const pendingRedemptions = redemptions.filter((r) => r.status === "pending");
  const pendingLeaders = leaderReqs.filter((r) => r.status === "pending");
  const openTickets = tickets.filter((t) => t.status === "pending");

  const totalPendingApprovals =
    pendingRes.length +
    pendingWorkshops.length +
    pendingStaffCoins.length +
    pendingTrainingCoins.length +
    pendingMeetingCoins.length +
    pendingRedemptions.length +
    pendingLeaders.length;

  // Avalia quais equipes não cumpriram as exigências semestrais
  const nonCompliantEntities = entities
    .map((e) => ({
      entity: e,
      reqs: calculateSemesterRequirements({
        entityId: e.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: volunteers,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      }),
    }))
    .filter((x) => !x.reqs.isCompliant)
    .sort((a, b) => a.reqs.fulfilledCount - b.reqs.fulfilledCount);

  const approvalShortcuts = [
    {
      tab: "reunioes" as const,
      label: "Reuniões Liga UNI",
      desc: "Liberar alta pontuação de Reunião",
      count: pendingMeetingCoins.length,
      icon: Megaphone,
    },
    {
      tab: "capacitacoes" as const,
      label: "Capacitações UNI",
      desc: "Validar presença e liberar LC",
      count: pendingTrainingCoins.length,
      icon: GraduationCap,
    },
    {
      tab: "staff" as const,
      label: "Staff em Eventos",
      desc: "Liberar alta pontuação de Staff",
      count: pendingStaffCoins.length,
      icon: HandHelping,
    },
    {
      tab: "oficinas" as const,
      label: "Oficinas de Equipes",
      desc: "Aprovar sala e liberar LC",
      count: pendingWorkshops.length,
      icon: Lightbulb,
    },
    {
      tab: "reservas" as const,
      label: "Reservas de Sala",
      desc: "Reuniões de equipe e oficinas",
      count: pendingRes.length,
      icon: DoorOpen,
    },
    {
      tab: "beneficios-cadastros" as const,
      label: "Benefícios & Cadastros",
      desc: "Resgates da loja e novos líderes",
      count: pendingRedemptions.length + pendingLeaders.length,
      icon: Gift,
    },
  ];

  type RecentPendingItem = {
    id: string;
    title: string;
    entityName: string;
    category: string;
    tab:
      | "reunioes"
      | "capacitacoes"
      | "staff"
      | "oficinas"
      | "reservas"
      | "beneficios-cadastros";
    dateLabel: string;
    coinsLabel?: string;
    status: "pending" | "approved" | "rejected" | "coins_pending";
  };

  const recentPendingItems: RecentPendingItem[] = [
    ...pendingRes.map((r) => ({
      id: `res-${r.id}`,
      title: `${roomName(r.room_id)} · ${r.motivo ?? "Reunião de equipe"}`,
      entityName: entityName(r.entity_id),
      category: "Reserva de Sala",
      tab: "reservas" as const,
      dateLabel: fmtDateTime(r.inicio),
      status: r.status,
    })),
    ...pendingWorkshops.map((w) => {
      const count = Math.max(1, countParticipants(w.ministrantes));
      const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
      const lc = calcWorkshopCoins(count, isJoint);
      return {
        id: `wk-${w.id}`,
        title: w.titulo,
        entityName: entityName(w.entity_id),
        category: "Oficina de Equipe",
        tab: "oficinas" as const,
        dateLabel: w.data_sugerida ? fmtDateTime(w.data_sugerida) : fmtDateTime(w.created_at),
        coinsLabel: `+${lc} LC`,
        status: w.status === "pending" ? ("pending" as const) : ("coins_pending" as const),
      };
    }),
    ...pendingStaffCoins.map((v) => {
      const call = calls.find((c) => c.id === v.call_id);
      const count = Math.max(1, countParticipants(v.participantes));
      const lc = calcStaffCoins(count);
      return {
        id: `sv-${v.id}`,
        title: call?.evento ?? "Staff em Evento",
        entityName: entityName(v.entity_id),
        category: "Staff em Evento",
        tab: "staff" as const,
        dateLabel: call ? fmtDateTime(call.inicio) : fmtDateTime(v.created_at),
        coinsLabel: `+${lc} LC`,
        status: "coins_pending" as const,
      };
    }),
    ...pendingTrainingCoins.map((r) => {
      const training = trainings.find((t) => t.id === r.training_id);
      const count = Math.max(1, countParticipants(r.participantes));
      const lc = calcTrainingCoins(count);
      return {
        id: `tr-${r.id}`,
        title: training?.titulo ?? "Capacitação UNI",
        entityName: entityName(r.entity_id),
        category: "Capacitação UNI",
        tab: "capacitacoes" as const,
        dateLabel: training ? fmtDateTime(training.inicio) : fmtDateTime(r.created_at),
        coinsLabel: `+${lc} LC`,
        status: "coins_pending" as const,
      };
    }),
    ...pendingMeetingCoins.map((a) => {
      const m = meetings.find((x) => x.id === a.meeting_id);
      const count = Math.max(1, countParticipants(a.representantes));
      const lc = calcMeetingCoins(count);
      return {
        id: `ma-${a.id}`,
        title: m?.titulo ?? "Reunião Liga UNI",
        entityName: entityName(a.entity_id),
        category: "Reunião Liga UNI",
        tab: "reunioes" as const,
        dateLabel: m ? fmtDateTime(m.inicio) : fmtDateTime(a.created_at),
        coinsLabel: `+${lc} LC`,
        status: "coins_pending" as const,
      };
    }),
    ...pendingRedemptions.map((r) => ({
      id: `red-${r.id}`,
      title: `Resgate: ${r.recompensa_titulo}`,
      entityName: entityName(r.entity_id),
      category: "Prêmio LigaCoins",
      tab: "beneficios-cadastros" as const,
      dateLabel: fmtDateTime(r.created_at),
      coinsLabel: `-${r.custo} LC`,
      status: r.status,
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Administrativo"
        description="Visão geral das entidades universitárias, aprovações por categoria, alertas semestrais e liberação de LigaCoins no Ágora Tech Park."
        action={
          <Button variant="hero" asChild>
            <Link to="/admin/aprovacoes">
              <ClipboardCheck className="size-4 mr-1" /> Central de Aprovações (
              {totalPendingApprovals})
            </Link>
          </Button>
        }
      />

      {/* Aviso (!) de Equipes que NÃO cumpriram as exigências semestrais */}
      {nonCompliantEntities.length > 0 && (
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground font-display text-xl font-black shadow-sm">
                !
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Alerta de Permanência Semestral (
                    {nonCompliantEntities.length} equipe
                    {nonCompliantEntities.length > 1 ? "s" : ""})
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <RefreshCw className="h-3 w-3" /> Semestre {CURRENT_SEMESTER_LABEL} · Renova
                    todo semestre
                  </span>
                </div>
                <h2 className="mt-1 font-display text-base sm:text-lg font-bold text-foreground">
                  Existem {nonCompliantEntities.length} equipe
                  {nonCompliantEntities.length > 1 ? "s" : ""} com exigências semestrais pendentes
                </h2>
                <p className="text-xs text-muted-foreground">
                  Clique no botão ao lado para abrir a página de pendências semestrais, conferir o
                  detalhamento de cada equipe e enviar aviso por e-mail ao líder.
                </p>
              </div>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link to="/admin/pendencias-semestrais">
                Ver equipes e pendências <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {pendingLeaders.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              Cadastros de líderes aguardando aprovação: {pendingLeaders.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aprove para liberar o acesso e criar automaticamente a entidade universitária.
            </p>
          </div>
          <Button size="sm" variant="default" asChild>
            <Link to="/admin/entidades">Revisar solicitações</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Entidades ativas" value={entities.length} icon={Building2} />
        <StatCard
          label="Central de Aprovações"
          value={totalPendingApprovals}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Reuniões Liga UNI"
          value={meetings.filter((m) => m.ativa).length}
          icon={Megaphone}
        />
        <StatCard
          label="Capacitações & Staff"
          value={trainings.filter((t) => t.ativa).length + calls.filter((c) => c.ativa).length}
          icon={GraduationCap}
        />
        <StatCard label="Chamados abertos" value={openTickets.length} icon={MessageSquare} />
      </div>

      {/* Atalhos diretos para as Sub-Abas de Aprovações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">
              Aprovações por Tipo de Atividade
            </h2>
            <p className="text-xs text-muted-foreground">
              Clique em qualquer frente para abrir a sub-aba correspondente na Central de Aprovações
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/aprovacoes">
              Ver todas <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {approvalShortcuts.map((s) => (
            <Link
              key={s.tab}
              to="/admin/aprovacoes"
              search={{ tab: s.tab }}
              className="group rounded-xl border border-border bg-card p-4 shadow-card hover:border-primary/40 hover:shadow-elevated transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <s.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-sm truncate">{s.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={
                    s.count > 0
                      ? "inline-flex items-center rounded-full bg-warning/15 text-warning border border-warning/30 px-2.5 py-0.5 text-xs font-bold"
                      : "inline-flex items-center rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-xs font-medium"
                  }
                >
                  Em aberto: {s.count}
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fila horizontal de pendências recentes */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Últimas Solicitações Pendentes de Aprovação / Liberação de LC
            </h2>
            <p className="text-xs text-muted-foreground">
              Cards horizontais das solicitações mais recentes aguardando ação da coordenação
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/aprovacoes">
              Abrir Central <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        {recentPendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma solicitação pendente no momento — tudo em dia!
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentPendingItems.map((item) => (
              <Link
                key={item.id}
                to="/admin/aprovacoes"
                search={{ tab: item.tab }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3.5 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>{item.entityName}</strong> · {item.dateLabel}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.coinsLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold">
                      <Coins className="size-3" /> {item.coinsLabel}
                    </span>
                  )}
                  {item.status === "coins_pending" ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold">
                      Liberar LC
                    </span>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
