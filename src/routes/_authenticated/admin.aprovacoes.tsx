import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Handshake,
  History,
  Lightbulb,
  MapPin,
  Megaphone,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CoinPerPersonTag, PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  countParticipants,
  CREDITS_COST_ROOM,
  CREDITS_PER_JOINT_WORKSHOP_BONUS,
  CREDITS_PER_MEETING_EVENT,
  CREDITS_PER_MEETING_MEMBER,
  CREDITS_PER_PEER_WORKSHOP,
  CREDITS_PER_STAFF_EVENT,
  CREDITS_PER_STAFF_MEMBER,
  CREDITS_PER_TRAINING_EVENT,
  CREDITS_PER_TRAINING_MEMBER,
  CREDITS_PER_WORKSHOP_MEMBER,
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
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/aprovacoes")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Central de Aprovações — Liga UNI" }] }),
  component: AdminAprovacoesPage,
});

type ApprovalTabKey =
  | "reunioes"
  | "capacitacoes"
  | "staff"
  | "oficinas"
  | "reservas"
  | "beneficios-cadastros";

function PastApprovalsCollapsible({
  count,
  label,
  children,
}: {
  count: number;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border/80 bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
      >
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-muted-foreground" />
          <span>
            {label} ({count})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span>{open ? "Ocultar concluídos" : "Ver concluídos"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && <div className="space-y-3 border-t border-border/60 p-4">{children}</div>}
    </div>
  );
}

function AdminAprovacoesPage() {
  const search = Route.useSearch();
  const qc = useQueryClient();

  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);

  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: redemptions = [] } = useQuery(rewardRedemptionsQuery());
  const { data: reservations = [] } = useQuery(reservationsQuery());
  const { data: leaderReqs = [] } = useQuery(leaderRequestsQuery);

  const entityName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "Entidade";
  const roomName = (id?: string | null) =>
    id ? (rooms.find((r) => r.id === id)?.nome ?? "Sala do Ágora") : "Sala do Ágora";

  const activeSection: ApprovalTabKey | null =
    search.tab === "reunioes" ||
    search.tab === "capacitacoes" ||
    search.tab === "staff" ||
    search.tab === "oficinas" ||
    search.tab === "reservas" ||
    search.tab === "beneficios-cadastros"
      ? search.tab
      : null;

  // Contagens pendentes e concluídas por tipo
  const pendingAttendances = attendances.filter((a) => a.presente && !a.moedas_liberadas);
  const doneAttendances = attendances.filter((a) => a.presente && a.moedas_liberadas);

  const pendingTrainingRegs = trainingRegs.filter((r) => !r.moedas_liberadas);
  const doneTrainingRegs = trainingRegs.filter((r) => r.moedas_liberadas);

  const pendingStaffVols = staffVols.filter((v) => !v.moedas_liberadas);
  const doneStaffVols = staffVols.filter((v) => v.moedas_liberadas);

  const pendingWorkshops = workshops.filter(
    (w) => w.status === "pending" || (w.status === "approved" && !w.moedas_liberadas),
  );
  const doneWorkshops = workshops.filter(
    (w) => w.status === "rejected" || (w.status === "approved" && w.moedas_liberadas),
  );

  const pendingReservations = reservations.filter((r) => r.status === "pending");
  const doneReservations = reservations.filter((r) => r.status !== "pending");

  const pendingRedemptions = redemptions.filter((r) => r.status === "pending");
  const doneRedemptions = redemptions.filter((r) => r.status !== "pending");

  const pendingLeaders = leaderReqs.filter((r) => r.status === "pending");
  const doneLeaders = leaderReqs.filter((r) => r.status !== "pending");

  // Mutations
  const releaseMeeting = useMutation({
    mutationFn: async ({ id, coins }: { id: string; coins: number }) => {
      const { error } = await supabase
        .from("meeting_attendances")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pela presença na Reunião Liga UNI!`);
      qc.invalidateQueries({ queryKey: ["meeting-attendances"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseTraining = useMutation({
    mutationFn: async ({ id, coins }: { id: string; coins: number }) => {
      const { error } = await supabase
        .from("training_registrations")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pela participação na Capacitação UNI!`);
      qc.invalidateQueries({ queryKey: ["training-registrations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseStaff = useMutation({
    mutationFn: async ({ id, coins }: { id: string; coins: number }) => {
      const { error } = await supabase
        .from("staff_volunteers")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pelo auxílio de Staff!`);
      qc.invalidateQueries({ queryKey: ["staff-volunteers"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const approveWorkshop = useMutation({
    mutationFn: async ({
      id,
      status,
      moedas_liberadas,
      coins,
    }: {
      id: string;
      status: "approved" | "rejected";
      moedas_liberadas: boolean;
      coins: number;
    }) => {
      const { error } = await supabase
        .from("peer_workshops")
        .update({ status, moedas_liberadas })
        .eq("id", id);
      if (error) throw error;
      return { status, moedas_liberadas, coins };
    },
    onSuccess: ({ status, moedas_liberadas, coins }) => {
      if (status === "rejected") {
        toast.success("Proposta de oficina recusada.");
      } else if (moedas_liberadas) {
        toast.success(`Oficina validada e +${coins} LigaCoins liberadas!`);
      } else {
        toast.success("Oficina aprovada e publicada para todas as equipes!");
      }
      qc.invalidateQueries({ queryKey: ["peer-workshops"] });
      qc.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideReservation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      toast.success(s === "approved" ? "Reserva de sala aprovada!" : "Reserva de sala recusada.");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["room-busy"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideRedemption = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("reward_redemptions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      toast.success(
        s === "approved"
          ? "Resgate de benefício aprovado!"
          : "Solicitação de resgate recusada (LigaCoins estornadas).",
      );
      qc.invalidateQueries({ queryKey: ["reward-redemptions"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideLeader = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("leader_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      toast.success(
        s === "approved"
          ? "Novo projeto/líder aprovado! O acesso já está liberado."
          : "Solicitação de cadastro recusada.",
      );
      qc.invalidateQueries({ queryKey: ["leader-requests"] });
      qc.invalidateQueries({ queryKey: ["entities"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const sectionMeta: Record<ApprovalTabKey, { title: string; subtitle: string }> = {
    reunioes: {
      title: "Aprovações · Reuniões Liga UNI",
      subtitle:
        "Valide a presença dos representantes das entidades nas Reuniões Liga UNI para liberar as LigaCoins pós-reunião.",
    },
    capacitacoes: {
      title: "Aprovações · Capacitações UNI",
      subtitle:
        "Confirme a participação dos membros inscritos nas Capacitações UNI e libere as LigaCoins correspondentes.",
    },
    staff: {
      title: "Aprovações · Staff em Eventos",
      subtitle:
        "Libere as LigaCoins de alto valor para os voluntários das equipes que atuaram como Staff nos eventos do Ágora Tech Park.",
    },
    oficinas: {
      title: "Aprovações · Oficinas de Equipes",
      subtitle:
        "Aprove a publicação de novas oficinas oferecidas pelas entidades (com sala gratuita) e libere as LigaCoins após sua realização.",
    },
    reservas: {
      title: "Aprovações · Reservas de Sala",
      subtitle:
        "Analise e aprove em 1 clique as solicitações de uso das salas do Ágora Tech Park para reuniões de equipe ou oficinas.",
    },
    "beneficios-cadastros": {
      title: "Aprovações · Benefícios & Novos Cadastros",
      subtitle:
        "Aprove trocas de LigaCoins na Loja de Benefícios e solicitações de acesso de novos líderes de projetos universitários.",
    },
  };

  // Visão Principal (Hub de Cards de Aprovações, igual ao modelo de Atividades & Salas do Líder)
  if (!activeSection) {
    return (
      <>
        <PageHeader
          title="Central de Aprovações"
          description="Escolha uma categoria abaixo ou nas sub-abas do menu lateral para analisar solicitações e liberar LigaCoins em cards horizontais."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Reuniões Liga UNI */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "reunioes" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                  <Megaphone className="h-6 w-6" />
                </div>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_MEETING_MEMBER}
                  perEvent={CREDITS_PER_MEETING_EVENT}
                  className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-600"
                />
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Reuniões Liga UNI
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Valide a chamada dos representantes de cada entidade nas Reuniões Gerais de
                alinhamento do Liga UNI para liberar a pontuação reforçada.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>{pendingAttendances.length} presença(s) pendente(s)</span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Reuniões <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Card 2: Capacitações UNI */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "capacitacoes" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_TRAINING_MEMBER}
                  perEvent={CREDITS_PER_TRAINING_EVENT}
                  className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-600"
                />
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Capacitações UNI
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Libere as LigaCoins das equipes que inscreveram membros e participaram das
                formações oferecidas pelo Liga Ágora.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>{pendingTrainingRegs.length} inscrição(ões) pendente(s)</span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Capacitações <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Card 3: Staff em Eventos */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "staff" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
                  <HandHelping className="h-6 w-6" />
                </div>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_STAFF_MEMBER}
                  perEvent={CREDITS_PER_STAFF_EVENT}
                  className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-600"
                />
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Staff em Eventos
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Valide a atuação dos voluntários das entidades na organização de Hackathons,
                Mostras e eventos no Ágora Tech Park.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>{pendingStaffVols.length} apoio(s) de staff pendente(s)</span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Staff <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Card 4: Oficinas de Equipes */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "oficinas" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success transition group-hover:bg-success group-hover:text-white">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_WORKSHOP_MEMBER}
                  perEvent={CREDITS_PER_PEER_WORKSHOP}
                  className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-600"
                />
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Oficinas de Equipes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Aprove propostas de oficinas ministradas pelas próprias entidades (individuais ou
                em conjunto com outro projeto) e libere as LigaCoins pós-evento.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>{pendingWorkshops.length} oficina(s) pendente(s)</span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Oficinas <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Card 5: Reservas de Sala */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "reservas" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <DoorOpen className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">
                  {CREDITS_COST_ROOM} <Coins className="h-3.5 w-3.5" /> / Grátis
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Reservas de Sala
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Aprove ou recuse solicitações de reserva do Auditório, Ágora.Share e Salas de
                Reunião A e B para reuniões de equipe ou oficinas.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>{pendingReservations.length} reserva(s) pendente(s)</span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Reservas <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Card 6: Benefícios & Cadastros */}
          <Link
            to="/admin/aprovacoes"
            search={{ tab: "beneficios-cadastros" }}
            className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                  <Gift className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  Loja & Novos Líderes
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Benefícios & Cadastros
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Aprove resgates de prêmios com LigaCoins (Mentorias VIP, Estandes, Coffee Break) e
                libere o cadastro de novas entidades universitárias.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
              <span>
                {pendingRedemptions.length + pendingLeaders.length} solicitação(ões) pendente(s)
              </span>
              <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                Abrir Benefícios & Cadastros <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </>
    );
  }

  const meta = sectionMeta[activeSection];

  return (
    <>
      <div className="mb-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs text-muted-foreground">
          <Link to="/admin/aprovacoes">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar para Central de Aprovações
          </Link>
        </Button>
      </div>

      <PageHeader title={meta.title} description={meta.subtitle} />

      {/* SUB-ABA 1: REUNIÕES LIGA UNI */}
      {activeSection === "reunioes" && (
        <div className="space-y-4">
          {pendingAttendances.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma presença em Reunião Liga UNI aguardando validação de LigaCoins no momento.
            </Card>
          )}

          <div className="space-y-3">
            {pendingAttendances.map((a) => {
              const meeting = meetings.find((m) => m.id === a.meeting_id);
              const count = Math.max(1, countParticipants(a.representantes));
              const coins = calcMeetingCoins(count);
              const isFuture = meeting ? new Date(meeting.fim) >= new Date() : false;

              return (
                <Card key={a.id}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">
                            {entityName(a.entity_id)}
                          </h3>
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            +{coins} LC ({count} representante{count > 1 ? "s" : ""})
                          </span>
                          {isFuture && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              Inscrito (evento futuro)
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {meeting?.titulo ?? "Reunião Liga UNI"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {meeting && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {fmtDateTime(meeting.inicio)} – {fmtDateTime(meeting.fim)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Representantes: {a.representantes}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                      <Button
                        size="sm"
                        onClick={() => releaseMeeting.mutate({ id: a.id, coins })}
                      >
                        <Coins className="mr-1.5 h-4 w-4" /> Validar presença (+{coins} LC)
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PastApprovalsCollapsible
            count={doneAttendances.length}
            label="Presenças em Reuniões já validadas"
          >
            {doneAttendances.map((a) => {
              const meeting = meetings.find((m) => m.id === a.meeting_id);
              const count = Math.max(1, countParticipants(a.representantes));
              const coins = calcMeetingCoins(count);
              return (
                <Card
                  key={a.id}
                  className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {entityName(a.entity_id)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> +{coins} LC creditadas
                        </span>
                      </div>
                      <div className="text-xs">
                        {meeting?.titulo ?? "Reunião Liga UNI"} · Representantes:{" "}
                        {a.representantes}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 2: CAPACITAÇÕES UNI */}
      {activeSection === "capacitacoes" && (
        <div className="space-y-4">
          {pendingTrainingRegs.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma participação em Capacitação UNI aguardando liberação de LigaCoins.
            </Card>
          )}

          <div className="space-y-3">
            {pendingTrainingRegs.map((r) => {
              const training = trainings.find((t) => t.id === r.training_id);
              const count = Math.max(1, countParticipants(r.participantes));
              const coins = calcTrainingCoins(count);
              const isFuture = training ? new Date(training.fim) >= new Date() : false;

              return (
                <Card key={r.id}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">
                            {entityName(r.entity_id)}
                          </h3>
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            +{coins} LC ({count} membro{count > 1 ? "s" : ""})
                          </span>
                          {isFuture && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              Inscrito (evento futuro)
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {training?.titulo ?? "Capacitação UNI"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {training && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {fmtDateTime(training.inicio)} – {fmtDateTime(training.fim)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Participantes: {r.participantes}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                      <Button
                        size="sm"
                        onClick={() => releaseTraining.mutate({ id: r.id, coins })}
                      >
                        <Coins className="mr-1.5 h-4 w-4" /> Liberar +{coins} LC
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PastApprovalsCollapsible
            count={doneTrainingRegs.length}
            label="Capacitações já validadas"
          >
            {doneTrainingRegs.map((r) => {
              const training = trainings.find((t) => t.id === r.training_id);
              const count = Math.max(1, countParticipants(r.participantes));
              const coins = calcTrainingCoins(count);
              return (
                <Card
                  key={r.id}
                  className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {entityName(r.entity_id)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> +{coins} LC creditadas
                        </span>
                      </div>
                      <div className="text-xs">
                        {training?.titulo ?? "Capacitação UNI"} · Membros: {r.participantes}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 3: STAFF EM EVENTOS */}
      {activeSection === "staff" && (
        <div className="space-y-4">
          {pendingStaffVols.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhum auxílio de Staff aguardando liberação de LigaCoins no momento.
            </Card>
          )}

          <div className="space-y-3">
            {pendingStaffVols.map((v) => {
              const call = staffCalls.find((c) => c.id === v.call_id);
              const count = Math.max(1, countParticipants(v.participantes));
              const coins = calcStaffCoins(count);
              const isFuture = call ? new Date(call.fim) >= new Date() : false;

              return (
                <Card key={v.id}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <HandHelping className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">
                            {entityName(v.entity_id)}
                          </h3>
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            +{coins} LC ({count} voluntário{count > 1 ? "s" : ""})
                          </span>
                          {isFuture && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              Inscrito (evento futuro)
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {call?.evento ?? "Evento Ágora"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {call && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {fmtDateTime(call.inicio)} – {fmtDateTime(call.fim)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Voluntários: {v.participantes}
                          </span>
                          {v.observacao && <span className="italic">Obs: {v.observacao}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                      <Button size="sm" onClick={() => releaseStaff.mutate({ id: v.id, coins })}>
                        <Coins className="mr-1.5 h-4 w-4" /> Liberar +{coins} LC
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PastApprovalsCollapsible
            count={doneStaffVols.length}
            label="Auxílios de Staff já validados"
          >
            {doneStaffVols.map((v) => {
              const call = staffCalls.find((c) => c.id === v.call_id);
              const count = Math.max(1, countParticipants(v.participantes));
              const coins = calcStaffCoins(count);
              return (
                <Card
                  key={v.id}
                  className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {entityName(v.entity_id)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> +{coins} LC creditadas
                        </span>
                      </div>
                      <div className="text-xs">
                        {call?.evento ?? "Evento Ágora"} · Voluntários: {v.participantes}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 4: OFICINAS DE EQUIPES */}
      {activeSection === "oficinas" && (
        <div className="space-y-4">
          {pendingWorkshops.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma oficina entre equipes pendente de aprovação ou liberação de moedas.
            </Card>
          )}

          <div className="space-y-3">
            {pendingWorkshops.map((w) => {
              const count = Math.max(1, countParticipants(w.ministrantes));
              const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
              const coins = calcWorkshopCoins(count, isJoint);

              return (
                <Card key={w.id}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">{w.titulo}</h3>
                          <StatusBadge status={w.status} />
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            +{coins} LC
                          </span>
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                            Sala Grátis
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary">
                          <span>Equipe proponente: {entityName(w.entity_id)}</span>
                          {isJoint && w.partner_entity_id && (
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5">
                              <Handshake className="h-3.5 w-3.5" /> Em conjunto com{" "}
                              {entityName(w.partner_entity_id)} (+
                              {CREDITS_PER_JOINT_WORKSHOP_BONUS} LC)
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{w.descricao}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {fmtDateTime(w.data_sugerida)}
                            {w.fim ? ` – ${fmtDateTime(w.fim)}` : ""}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {roomName(w.room_id)}
                          </span>
                          <span>
                            <b>{count} membro(s):</b> {w.ministrantes}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                      {w.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              approveWorkshop.mutate({
                                id: w.id,
                                status: "approved",
                                moedas_liberadas: false,
                                coins,
                              })
                            }
                          >
                            <Check className="mr-1 h-4 w-4" /> Aprovar & Publicar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              approveWorkshop.mutate({
                                id: w.id,
                                status: "rejected",
                                moedas_liberadas: false,
                                coins,
                              })
                            }
                          >
                            <X className="mr-1 h-4 w-4" /> Recusar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() =>
                          approveWorkshop.mutate({
                            id: w.id,
                            status: "approved",
                            moedas_liberadas: true,
                            coins,
                          })
                        }
                      >
                        <Coins className="mr-1.5 h-4 w-4" /> Liberar +{coins} LC
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PastApprovalsCollapsible
            count={doneWorkshops.length}
            label="Oficinas já concluídas ou avaliadas"
          >
            {doneWorkshops.map((w) => {
              const count = Math.max(1, countParticipants(w.ministrantes));
              const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
              const coins = calcWorkshopCoins(count, isJoint);
              return (
                <Card
                  key={w.id}
                  className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{w.titulo}</span>
                        <StatusBadge status={w.status} />
                        {w.moedas_liberadas && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> +{coins} LC creditadas
                          </span>
                        )}
                      </div>
                      <div className="text-xs">
                        {entityName(w.entity_id)} · {fmtDateTime(w.data_sugerida)} ·{" "}
                        {w.ministrantes}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 5: RESERVAS DE SALA */}
      {activeSection === "reservas" && (
        <div className="space-y-4">
          {pendingReservations.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma reserva de sala pendente de análise no momento.
            </Card>
          )}

          <div className="space-y-3">
            {pendingReservations.map((r) => {
              const isOficina = r.purpose === "capacitacao_geral";
              return (
                <Card key={r.id}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">
                            {roomName(r.room_id)}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isOficina
                                ? "bg-success/15 text-success"
                                : "bg-amber-500/15 text-amber-700"
                            }`}
                          >
                            {isOficina
                              ? "Oficina p/ equipes (Grátis)"
                              : `Reunião de equipe (${CREDITS_COST_ROOM} LC)`}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>

                        <div className="text-xs font-semibold text-primary">
                          Solicitante: {entityName(r.entity_id)}
                        </div>

                        <p className="text-sm text-muted-foreground">{r.motivo}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {fmtDateTime(r.inicio)} – {fmtDateTime(r.fim)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                      <Button
                        size="sm"
                        onClick={() => decideReservation.mutate({ id: r.id, status: "approved" })}
                      >
                        <Check className="mr-1 h-4 w-4" /> Aprovar reserva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decideReservation.mutate({ id: r.id, status: "rejected" })}
                      >
                        <X className="mr-1 h-4 w-4" /> Recusar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PastApprovalsCollapsible
            count={doneReservations.length}
            label="Reservas de Sala já avaliadas"
          >
            {doneReservations.map((r) => (
              <Card
                key={r.id}
                className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{roomName(r.room_id)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-xs">
                      {entityName(r.entity_id)} · {fmtDateTime(r.inicio)} – {fmtDateTime(r.fim)} ·{" "}
                      {r.motivo}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 6: BENEFÍCIOS & CADASTROS */}
      {activeSection === "beneficios-cadastros" && (
        <div className="space-y-4">
          {pendingRedemptions.length === 0 && pendingLeaders.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              Nenhum resgate de benefício ou cadastro de novo líder pendente no momento.
            </Card>
          )}

          <div className="space-y-3">
            {pendingRedemptions.map((red) => (
              <Card key={red.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                          Troca de LigaCoins (-{red.custo} LC)
                        </span>
                        <h3 className="font-semibold text-base text-foreground">
                          {red.recompensa_titulo}
                        </h3>
                      </div>
                      <div className="text-xs font-semibold text-primary">
                        Entidade solicitante: {entityName(red.entity_id)}
                      </div>
                      {red.observacao && (
                        <p className="text-sm text-muted-foreground">Obs: {red.observacao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                    <Button
                      size="sm"
                      onClick={() => decideRedemption.mutate({ id: red.id, status: "approved" })}
                    >
                      <Check className="mr-1 h-4 w-4" /> Aprovar benefício
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideRedemption.mutate({ id: red.id, status: "rejected" })}
                    >
                      <X className="mr-1 h-4 w-4" /> Recusar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {pendingLeaders.map((req) => (
              <Card key={req.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                          Novo Projeto / Líder
                        </span>
                        <h3 className="font-semibold text-base text-foreground">
                          {req.projeto} ({req.faculdade})
                        </h3>
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        Líder: <b>{req.nome_lider}</b> · {req.email}
                      </div>
                      <p className="text-sm text-muted-foreground">{req.descricao}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                    <Button
                      size="sm"
                      onClick={() => decideLeader.mutate({ id: req.id, status: "approved" })}
                    >
                      <Check className="mr-1 h-4 w-4" /> Aprovar cadastro
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideLeader.mutate({ id: req.id, status: "rejected" })}
                    >
                      <X className="mr-1 h-4 w-4" /> Recusar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <PastApprovalsCollapsible
            count={doneRedemptions.length + doneLeaders.length}
            label="Benefícios e Cadastros já avaliados"
          >
            {doneRedemptions.map((red) => (
              <Card
                key={red.id}
                className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{red.recompensa_titulo}</span>
                      <StatusBadge status={red.status} />
                    </div>
                    <div className="text-xs">
                      {entityName(red.entity_id)} · Custo: {red.custo} LC
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {doneLeaders.map((req) => (
              <Card
                key={req.id}
                className="border-border/60 bg-muted/40 text-muted-foreground opacity-75"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {req.projeto} ({req.faculdade})
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="text-xs">
                      {req.nome_lider} · {req.email}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </PastApprovalsCollapsible>
        </div>
      )}
    </>
  );
}
