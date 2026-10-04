import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, PageHeader, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import {
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  calculateSemesterRequirements,
  countParticipants,
  CREDITS_COST_ROOM,
  eventsQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  membersQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  rewardRedemptionsQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";
import { fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/")({
  component: LiderHome,
});

type RecentRequestItem = {
  id: string;
  categoryLabel: string;
  icon: LucideIcon;
  iconBg: string;
  title: string;
  subtitle: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  coinsBadge?: { text: string; tone: "amber" | "green" | "primary" };
  to: string;
  search?: { tab?: string };
};

const reqIconMap = {
  reunioes: Megaphone,
  staff: HandHelping,
  capacitacoes: GraduationCap,
  oficinas: Lightbulb,
} as const;

function LiderHome() {
  const { user } = Route.useRouteContext();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const id = entity?.id;

  const members = useQuery({ ...membersQuery(id), enabled: !!id });
  const events = useQuery({ ...eventsQuery(id), enabled: !!id });
  const res = useQuery({ ...reservationsQuery(id), enabled: !!id });
  const rooms = useQuery(roomsQuery);
  const trainings = useQuery(trainingsQuery);
  const myTrainingRegs = useQuery({ ...trainingRegistrationsQuery(id), enabled: !!id });
  const staffCalls = useQuery(staffCallsQuery);
  const myStaffVols = useQuery({ ...staffVolunteersQuery(id), enabled: !!id });
  const myWorkshops = useQuery({ ...peerWorkshopsQuery(id), enabled: !!id });
  const meetings = useQuery(generalMeetingsQuery);
  const myAttendances = useQuery({ ...meetingAttendancesQuery(id), enabled: !!id });
  const myRedemptions = useQuery({ ...rewardRedemptionsQuery(id), enabled: !!id });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const membersCount = members.data?.length ?? 0;
  const upcomingCount = (events.data ?? []).filter((e) => new Date(e.fim) >= new Date()).length;

  const semesterReqs = calculateSemesterRequirements({
    entityId: entity.id,
    generalMeetings: meetings.data ?? [],
    meetingAttendances: myAttendances.data ?? [],
    staffVolunteers: myStaffVols.data ?? [],
    trainingRegistrations: myTrainingRegs.data ?? [],
    peerWorkshops: myWorkshops.data ?? [],
  });

  const roomName = (rid: string) =>
    (rooms.data ?? []).find((r) => r.id === rid)?.nome ?? "Sala do Ágora";
  const trainingTitle = (tid: string) =>
    (trainings.data ?? []).find((t) => t.id === tid)?.titulo ?? "Capacitação UNI";
  const callTitle = (cid: string) =>
    (staffCalls.data ?? []).find((c) => c.id === cid)?.evento ?? "Evento Ágora";
  const meetingTitle = (mid: string) =>
    (meetings.data ?? []).find((m) => m.id === mid)?.titulo ?? "Reunião Liga UNI";

  // Lista unificada das solicitações mais recentes da equipe (Reservas de sala, Oficinas oferecidas, Validações e Trocas de LigaCoins)
  const recentRequests: RecentRequestItem[] = [
    ...(res.data ?? []).map((r): RecentRequestItem => {
      const isOficina = r.purpose === "capacitacao_geral";
      return {
        id: `res-${r.id}`,
        categoryLabel: isOficina
          ? "Reserva de Sala · Oficina"
          : "Reserva de Sala · Reunião de Equipe",
        icon: DoorOpen,
        iconBg: "bg-primary/10 text-primary",
        title: roomName(r.room_id),
        subtitle: `${fmtDateTime(r.inicio)} · ${r.motivo}`,
        createdAt: r.created_at,
        status: r.status,
        coinsBadge: isOficina
          ? { text: "Grátis", tone: "green" }
          : { text: `-${CREDITS_COST_ROOM} LC`, tone: "primary" },
        to: "/lider/capacitacoes",
        search: { tab: isOficina ? "oficinas" : "reunioes-equipe" },
      };
    }),
    ...(myWorkshops.data ?? []).map((w): RecentRequestItem => {
      const count = Math.max(1, countParticipants(w.ministrantes));
      const coins = calcWorkshopCoins(count, Boolean(w.em_conjunto && w.partner_entity_id));
      return {
        id: `pw-${w.id}`,
        categoryLabel: "Oficina Oferecida pela Equipe",
        icon: Lightbulb,
        iconBg: "bg-success/15 text-success",
        title: w.titulo,
        subtitle: `Data sugerida: ${fmtDateTime(w.data_sugerida)} · ${w.ministrantes}`,
        createdAt: w.created_at,
        status: w.moedas_liberadas ? "approved" : w.status,
        coinsBadge: {
          text: w.moedas_liberadas ? `+${coins} LC creditadas` : `+${coins} LC`,
          tone: w.moedas_liberadas ? "green" : "amber",
        },
        to: "/lider/capacitacoes",
        search: { tab: "oficinas" },
      };
    }),
    ...(myTrainingRegs.data ?? []).map((tr): RecentRequestItem => {
      const count = Math.max(1, countParticipants(tr.participantes));
      const coins = calcTrainingCoins(count);
      return {
        id: `treg-${tr.id}`,
        categoryLabel: "Moedas · Capacitação UNI",
        icon: GraduationCap,
        iconBg: "bg-primary/10 text-primary",
        title: trainingTitle(tr.training_id),
        subtitle: `${count} membro(s): ${tr.participantes}`,
        createdAt: tr.created_at,
        status: tr.moedas_liberadas ? "approved" : "pending",
        coinsBadge: {
          text: `+${coins} LC`,
          tone: tr.moedas_liberadas ? "green" : "amber",
        },
        to: "/lider/capacitacoes",
        search: { tab: "capacitacoes" },
      };
    }),
    ...(myStaffVols.data ?? []).map((sv): RecentRequestItem => {
      const count = Math.max(1, countParticipants(sv.participantes));
      const coins = calcStaffCoins(count);
      return {
        id: `sv-${sv.id}`,
        categoryLabel: "Moedas · Auxílio de Staff",
        icon: HandHelping,
        iconBg: "bg-accent/15 text-accent",
        title: callTitle(sv.call_id),
        subtitle: `${count} voluntário(s): ${sv.participantes}`,
        createdAt: sv.created_at,
        status: sv.moedas_liberadas ? "approved" : "pending",
        coinsBadge: {
          text: `+${coins} LC`,
          tone: sv.moedas_liberadas ? "green" : "amber",
        },
        to: "/lider/capacitacoes",
        search: { tab: "staff" },
      };
    }),
    ...(myAttendances.data ?? [])
      .filter((a) => a.presente)
      .map((a): RecentRequestItem => {
        const count = Math.max(1, countParticipants(a.representantes));
        const coins = calcMeetingCoins(count);
        return {
          id: `ma-${a.id}`,
          categoryLabel: "Moedas · Reunião Liga UNI",
          icon: Megaphone,
          iconBg: "bg-amber-500/15 text-amber-600",
          title: meetingTitle(a.meeting_id),
          subtitle: `${count} representante(s): ${a.representantes}`,
          createdAt: a.created_at,
          status: a.moedas_liberadas ? "approved" : "pending",
          coinsBadge: {
            text: `+${coins} LC`,
            tone: a.moedas_liberadas ? "green" : "amber",
          },
          to: "/lider/reunioes",
        };
      }),
    ...(myRedemptions.data ?? []).map(
      (red): RecentRequestItem => ({
        id: `red-${red.id}`,
        categoryLabel: "Troca de LigaCoins · Benefício",
        icon: Gift,
        iconBg: "bg-amber-500/15 text-amber-600",
        title: red.recompensa_titulo,
        subtitle: red.observacao || "Solicitação de resgate na Loja de Benefícios",
        createdAt: red.created_at,
        status: red.status,
        coinsBadge: { text: `-${red.custo} LC`, tone: "primary" },
        to: "/lider/ligacoins",
      }),
    ),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const pendingRequestsCount = recentRequests.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Olá, equipe do(a)"
        description={entity.nome}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/lider/guia">
              <BookOpen className="mr-1.5 h-4 w-4 text-primary" /> Como funciona o portal
            </Link>
          </Button>
        }
      />

      {/* Painel Visual de Exigências Semestrais para Continuar na Liga UNI */}
      <div
        className={
          semesterReqs.isCompliant
            ? "mb-6 rounded-2xl border-2 border-success/40 bg-success/5 p-5 shadow-card"
            : "mb-6 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 shadow-card"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  semesterReqs.isCompliant
                    ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-0.5 text-xs font-bold text-success"
                    : "inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-0.5 text-xs font-bold text-destructive"
                }
              >
                {semesterReqs.isCompliant ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {semesterReqs.fulfilledCount}/{semesterReqs.totalRequirements} exigências
                semestrais cumpridas
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <RefreshCw className="h-3 w-3" /> Semestre {semesterReqs.semesterLabel} · Renova
                todo semestre
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Exigências Semestrais de Permanência na Liga UNI
            </h2>
            <p className="text-xs text-muted-foreground">
              {semesterReqs.isCompliant
                ? "Parabéns! Sua equipe já cumpriu todas as metas obrigatórias deste semestre."
                : `Atenção: falta(m) ${semesterReqs.missingRequirementsCount} exigência(s) para garantir a permanência da equipe no semestre. Caso não sejam atendidas até o fim do semestre, a coordenação recebe um alerta (!).`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-semibold text-muted-foreground">Progresso Semestral</div>
              <div
                className={
                  semesterReqs.isCompliant
                    ? "font-display text-xl font-bold text-success"
                    : "font-display text-xl font-bold text-destructive"
                }
              >
                {Math.round(
                  (semesterReqs.fulfilledCount / semesterReqs.totalRequirements) * 100,
                )}
                %
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {semesterReqs.items.map((item) => {
            const Icon = reqIconMap[item.key];
            const pct = Math.min(100, Math.round((item.current / item.target) * 100));
            return (
              <div
                key={item.key}
                className={
                  item.fulfilled
                    ? "flex flex-col justify-between rounded-xl border border-success/40 bg-card p-4 shadow-xs"
                    : "flex flex-col justify-between rounded-xl border-2 border-destructive/35 bg-card p-4 shadow-xs"
                }
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={
                        item.fulfilled
                          ? "flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"
                          : "flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive"
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={
                        item.fulfilled
                          ? "inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success"
                          : "inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[11px] font-bold text-destructive"
                      }
                    >
                      {item.fulfilled ? "✓ Cumprida" : item.statusText}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                    {item.ruleDescription}
                  </p>
                </div>

                <div className="mt-4 space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Realizado no semestre:</span>
                    <span className="font-bold text-foreground">
                      {item.current} / {item.target}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={
                        item.fulfilled
                          ? "h-full rounded-full bg-success transition-all"
                          : "h-full rounded-full bg-destructive transition-all"
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Button
                    asChild
                    variant={item.fulfilled ? "ghost" : "outline"}
                    size="sm"
                    className="w-full h-7 text-xs mt-1"
                  >
                    <Link to={item.to} search={item.search}>
                      {item.fulfilled ? "Ver atividade" : "Cumprir agora"}{" "}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Cards essenciais do topo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/lider/equipe"
          className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-card"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold leading-none">{membersCount}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">Membros da equipe</div>
          </div>
        </Link>

        <Link
          to="/lider/calendario"
          className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-card"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold leading-none">{upcomingCount}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">
              Próximos eventos do projeto
            </div>
          </div>
        </Link>

        <Link
          to="/lider/capacitacoes"
          search={{ tab: "reunioes-equipe" }}
          className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-card"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold leading-none">
              {pendingRequestsCount}
            </div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">
              Solicitações pendentes
            </div>
          </div>
        </Link>
      </div>

      {/* Bloco de Solicitações Recentes (Pendente / Aprovada): Reservas de Sala, Oficinas e LigaCoins */}
      <Card className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">
              Minhas Solicitações Recentes (Salas, Oficinas & LigaCoins)
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe o status (Pendente ou Aprovada) das últimas solicitações da sua equipe
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/lider/capacitacoes" search={{ tab: "oficinas" }}>
                Oferecer Oficina
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/lider/capacitacoes" search={{ tab: "reunioes-equipe" }}>
                Reservar Sala
              </Link>
            </Button>
          </div>
        </div>

        {recentRequests.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sua equipe ainda não possui solicitações de reserva, oficina ou validação de moedas.
          </p>
        ) : (
          <div className="divide-y">
            {recentRequests.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-1"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.categoryLabel}
                        </span>
                        <StatusBadge status={item.status} />
                        {item.coinsBadge && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.coinsBadge.tone === "green"
                                ? "bg-success/15 text-success"
                                : item.coinsBadge.tone === "amber"
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-primary/15 text-primary"
                            }`}
                          >
                            <Coins className="h-3 w-3" /> {item.coinsBadge.text}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </h3>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link to={item.to} search={item.search}>
                      Ver detalhes <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
