import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
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
  adminNote?: string | null;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  coinsBadge?: { text: string; tone: "amber" | "green" | "primary" };
  to: string;
  search?: { tab?: string };
};

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
        adminNote: r.admin_note,
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
        adminNote: w.admin_note,
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
        adminNote: red.admin_note,
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
                      {item.adminNote && (
                        <div className="mt-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                          <b>Justificativa do administrador:</b> {item.adminNote}
                        </div>
                      )}
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
