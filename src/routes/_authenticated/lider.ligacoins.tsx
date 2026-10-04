import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  HelpCircle,
  Lightbulb,
  Megaphone,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CoinPerPersonTag, PageHeader, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  calculateEntityCoins,
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
  CREDITS_WELCOME,
  entitiesQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  REWARD_CATALOG,
  rewardRedemptionsQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
  type RewardItem,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/ligacoins")({
  head: () => ({ meta: [{ title: "LigaCoins & Recompensas — Liga UNI" }] }),
  component: LiderLigaCoinsPage,
});

function LiderLigaCoinsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const id = entity?.id;

  const [tab, setTab] = useState<
    "como-funciona" | "beneficios" | "ranking" | "entradas" | "saidas"
  >("como-funciona");

  const { data: allEntities = [] } = useQuery(entitiesQuery);
  const { data: allTrainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: allStaffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: allWorkshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: allAttendances = [] } = useQuery(meetingAttendancesQuery());

  const { data: reservations = [] } = useQuery({ ...reservationsQuery(id), enabled: !!id });
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: trainingRegs = [] } = useQuery({
    ...trainingRegistrationsQuery(id),
    enabled: !!id,
  });
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: staffVols = [] } = useQuery({ ...staffVolunteersQuery(id), enabled: !!id });
  const { data: workshops = [] } = useQuery({ ...peerWorkshopsQuery(id), enabled: !!id });
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery({ ...meetingAttendancesQuery(id), enabled: !!id });
  const { data: redemptions = [] } = useQuery({
    ...rewardRedemptionsQuery(id),
    enabled: !!id,
  });

  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [observacao, setObservacao] = useState("");

  const redeem = useMutation({
    mutationFn: async () => {
      if (!selectedReward || !entity) return;
      const { error } = await supabase.from("reward_redemptions").insert({
        entity_id: entity.id,
        recompensa_id: selectedReward.id,
        recompensa_titulo: selectedReward.titulo,
        custo: selectedReward.custo,
        observacao,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedReward(null);
      setObservacao("");
      setTab("saidas");
      toast.success(
        "Pedido de resgate enviado para a administração do Ágora! Acompanhe na aba Saídas.",
      );
      qc.invalidateQueries({ queryKey: ["reward-redemptions"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const coins = calculateEntityCoins({
    entityId: id,
    reservations,
    trainingRegistrations: trainingRegs,
    staffVolunteers: staffVols,
    peerWorkshops: workshops,
    meetingAttendances: attendances,
    generalMeetings: meetings,
    rewardRedemptions: redemptions,
  });

  // Ranking Anual de Engajamento (soma total de LigaCoins ganhas no ano — gastar não diminui posição no ranking!)
  const ranking = allEntities
    .map((ent) => {
      const c = calculateEntityCoins({
        entityId: ent.id,
        trainingRegistrations: allTrainingRegs.filter((r) => r.entity_id === ent.id),
        staffVolunteers: allStaffVols.filter((v) => v.entity_id === ent.id),
        peerWorkshops: allWorkshops.filter((w) => w.entity_id === ent.id),
        meetingAttendances: allAttendances.filter((a) => a.entity_id === ent.id),
        generalMeetings: meetings,
      });
      return { id: ent.id, nome: ent.nome, totalEarned: c.earnedCredits };
    })
    .sort((a, b) => b.totalEarned - a.totalEarned);

  const roomName = (rid: string) => rooms.find((r) => r.id === rid)?.nome ?? "Sala";
  const trainingTitle = (tid: string) =>
    trainings.find((t) => t.id === tid)?.titulo ?? "Capacitação";
  const callTitle = (cid: string) =>
    staffCalls.find((c) => c.id === cid)?.evento ?? "Evento Ágora";
  const meetingTitle = (mid: string) =>
    meetings.find((m) => m.id === mid)?.titulo ?? "Reunião Liga UNI";

  return (
    <>
      <PageHeader
        title="Central LigaCoins"
        description="Gerencie seus créditos colaborativos: entenda como funcionam as LigaCoins, troque por benefícios exclusivos, acompanhe o Ranking Anual e consulte suas entradas e saídas."
      />

      {/* Resumo de Saldo */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span>Saldo Disponível para Troca</span>
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-amber-600">
            {coins.balanceCredits} <span className="text-base font-semibold">LigaCoins</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Use em salas de reunião ou troque por benefícios
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-success">
            <span>Pontuação Anual (Total Ganho)</span>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-success">
            +{coins.earnedCredits} <span className="text-base font-semibold">LC</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {coins.pendingCredits > 0
              ? `+${coins.pendingCredits} LC aguardando validação pós-evento`
              : "Conta para o Prêmio Entidade Destaque do Ano!"}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Total Trocado / Utilizado</span>
            <ArrowDownRight className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">
            -{coins.usedCredits} <span className="text-base font-semibold">LC</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Gastar moedas não reduz sua posição no Ranking Anual!
          </p>
        </Card>
      </div>

      {/* Sub-abas: Como Funciona (inicial), Benefícios, Ranking, Entradas, Saídas */}
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as "como-funciona" | "beneficios" | "ranking" | "entradas" | "saidas")
        }
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="como-funciona" className="gap-1.5">
            <HelpCircle className="h-4 w-4" />
            Como funciona
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="gap-1.5">
            <Gift className="h-4 w-4" />
            Benefícios
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-1.5">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="entradas" className="gap-1.5">
            <ArrowUpRight className="h-4 w-4" />
            Entradas
          </TabsTrigger>
          <TabsTrigger value="saidas" className="gap-1.5">
            <ArrowDownRight className="h-4 w-4" />
            Saídas
          </TabsTrigger>
        </TabsList>

        {/* Sub-aba Inicial: Como Funciona as LigaCoins */}
        <TabsContent value="como-funciona">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">Como funcionam as LigaCoins</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                      <Sparkles className="h-3 w-3" /> Capacitações são 100% gratuitas e dão moedas!
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Participe para acumular LigaCoins e troque por salas de reunião, mentorias VIP,
                    estandes e o Prêmio Destaque do Ano.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTab("beneficios")}>
                Ir para Loja de Benefícios
              </Button>
            </div>

            {/* Legenda explicativa dos ícones de LigaCoins por membro e por evento */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-foreground">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  Entenda os selos de pontuação:
                </span>
                <CoinPerPersonTag
                  perMember={5}
                  perEvent={10}
                  className="rounded-full bg-card px-2.5 py-0.5 text-xs text-amber-600 shadow-2xs"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span>/</span>
                  <User className="h-3.5 w-3.5 text-amber-600" /> = <b>LigaCoins por membro</b>{" "}
                  participante
                </span>
                <span className="inline-flex items-center gap-1">
                  <b>(+10</b> <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <b>)</b> = <b>Bônus fixo por evento</b> realizado
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {/* Como Ganhar */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-success">
                  Como ganhar LigaCoins (liberadas pós-evento pelo Admin)
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Reuniões Liga UNI</span>
                        <CoinPerPersonTag
                          perMember={CREDITS_PER_MEETING_MEMBER}
                          perEvent={CREDITS_PER_MEETING_EVENT}
                          className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-700"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Presença obrigatória: +{CREDITS_PER_MEETING_MEMBER} por representante +{" "}
                        {CREDITS_PER_MEETING_EVENT} por reunião
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/lider/reunioes">Presença</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-success/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Participar de Capacitações</span>
                        <CoinPerPersonTag
                          perMember={CREDITS_PER_TRAINING_MEMBER}
                          perEvent={CREDITS_PER_TRAINING_EVENT}
                          className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Oferecidas pelo Liga: +{CREDITS_PER_TRAINING_MEMBER} por membro +{" "}
                        {CREDITS_PER_TRAINING_EVENT} por evento
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/lider/capacitacoes" search={{ tab: "capacitacoes" }}>
                      Inscrever
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-success/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                      <HandHelping className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Auxiliar Eventos como Staff</span>
                        <CoinPerPersonTag
                          perMember={CREDITS_PER_STAFF_MEMBER}
                          perEvent={CREDITS_PER_STAFF_EVENT}
                          className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Apoie eventos do Ágora: +{CREDITS_PER_STAFF_MEMBER} por voluntário +{" "}
                        {CREDITS_PER_STAFF_EVENT} por evento
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/lider/capacitacoes" search={{ tab: "staff" }}>
                      Apoiar
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-success/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Oferecer Oficina p/ Equipes</span>
                        <CoinPerPersonTag
                          perMember={CREDITS_PER_WORKSHOP_MEMBER}
                          perEvent={CREDITS_PER_PEER_WORKSHOP}
                          className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{CREDITS_PER_WORKSHOP_MEMBER} por membro +{CREDITS_PER_PEER_WORKSHOP} por
                        oficina (+{CREDITS_PER_JOINT_WORKSHOP_BONUS} se for em conjunto com outro
                        projeto)
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/lider/capacitacoes" search={{ tab: "oficinas" }}>
                      Propor
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Onde Usar / Trocar */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  Onde usar e trocar suas LigaCoins
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-primary/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Reservar Salas do Ágora</span>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                          -{CREDITS_COST_ROOM} LC (reunião)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Salas para Reuniões de Equipe (-{CREDITS_COST_ROOM} LC) ou para Oferecer
                        Oficina (Grátis)
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/lider/capacitacoes" search={{ tab: "reunioes-equipe" }}>
                      Reservar
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-primary/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Mentorias VIP, Divulgação & Coffee Break
                        </span>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                          -{REWARD_CATALOG[0]?.custo ?? 100} a -
                          {REWARD_CATALOG[REWARD_CATALOG.length - 1]?.custo ?? 400} LC
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Troque por mentoria com empresas do Ágora, destaque nas redes ou estande na
                        Mostra
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setTab("beneficios")}>
                    Resgatar
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Prêmio Fim de Ano & Kit Entidade Destaque
                        </span>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          Top Ranking Anual
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gastar moedas não diminui sua pontuação no Ranking Anual de Fim de Ano!
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setTab("ranking")}>
                    Ver Ranking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Sub-aba 2: Benefícios */}
        <TabsContent value="beneficios" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Troque o saldo de LigaCoins da sua entidade por mentorias com empresas do Ágora,
            divulgação oficial, estandes ou kits de apoio.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REWARD_CATALOG.map((item) => {
              const canAfford = coins.balanceCredits >= item.custo;
              return (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between space-y-4 border-primary/15"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {item.categoria}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                        <Coins className="h-3.5 w-3.5" /> {item.custo} LC
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold text-base leading-snug">{item.titulo}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground">{item.descricao}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={canAfford ? "default" : "outline"}
                    disabled={!canAfford}
                    onClick={() => {
                      setObservacao("");
                      setSelectedReward(item);
                    }}
                  >
                    {canAfford
                      ? `Resgatar por ${item.custo} LC`
                      : `Faltam ${item.custo - coins.balanceCredits} LC`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Sub-aba 3: Ranking */}
        <TabsContent value="ranking">
          <Card className="max-w-3xl border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/20 p-3 text-amber-600">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">
                  Ranking Anual — Prêmio Entidade Destaque do Fim de Ano
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  As 3 entidades que mais acumularem LigaCoins ao longo do ano recebem o Troféu &
                  Kit Oficial Liga UNI na Reunião Geral de Encerramento.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-card/80 p-3 text-xs text-muted-foreground">
              <b className="text-foreground">Regra justa:</b> O ranking considera o{" "}
              <b>Total Ganho no ano</b> (soma de todas as entradas validadas). Você pode trocar suas
              LigaCoins por salas e benefícios à vontade sem perder posição no ranking!
            </div>

            <ul className="mt-5 space-y-2.5 text-sm">
              {ranking.map((r, idx) => {
                const isMe = r.id === entity.id;
                return (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      isMe ? "border-amber-500 bg-amber-500/15 font-semibold" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-700">
                        {idx + 1}º
                      </span>
                      <span className="truncate">{r.nome}</span>
                      {isMe && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Sua entidade
                        </span>
                      )}
                    </div>
                    <span className="ml-3 shrink-0 font-display text-base font-bold text-amber-600">
                      {r.totalEarned} LC
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex items-center gap-2 border-t border-amber-500/20 pt-3 text-xs text-amber-700">
              <Award className="h-4 w-4 shrink-0" />
              <span>Premiação entregue na última Reunião Liga UNI do ano</span>
            </div>
          </Card>
        </TabsContent>

        {/* Sub-aba 4: Entradas */}
        <TabsContent value="entradas">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-semibold">Histórico de Ganhos (Entradas de LigaCoins)</h3>
                <p className="text-xs text-muted-foreground">
                  Reuniões Liga UNI, Capacitações, Auxílio de Staff e Oficinas ministradas
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/lider/capacitacoes">Ganhar mais LigaCoins</Link>
              </Button>
            </div>

            {id === "ent-5" &&
            attendances.filter((a) => a.presente).length === 0 &&
            trainingRegs.length === 0 &&
            staffVols.length === 0 &&
            workshops.filter((w) => w.status !== "rejected").length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Sua equipe acabou de se registrar e ainda possui 0 LigaCoins. Inscreva membros nas
                Reuniões Liga UNI, Capacitações, Staff ou ofereça uma Oficina para ganhar suas
                primeiras moedas!
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {id !== "ent-5" && (
                  <li className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Bônus de Boas-Vindas Liga UNI</div>
                        <div className="text-xs text-muted-foreground">
                          Crédito inicial da entidade
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                      +{CREDITS_WELCOME} LC
                    </span>
                  </li>
                )}

              {attendances
                .filter((a) => a.presente)
                .map((a) => {
                  const count = Math.max(1, countParticipants(a.representantes));
                  const total = calcMeetingCoins(count);
                  return (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{meetingTitle(a.meeting_id)}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>
                              {count} representante(s) ({a.representantes}) ·
                            </span>
                            <CoinPerPersonTag
                              perMember={CREDITS_PER_MEETING_MEMBER}
                              perEvent={CREDITS_PER_MEETING_EVENT}
                              className="text-amber-600"
                            />
                          </div>
                        </div>
                      </div>
                      {a.moedas_liberadas ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> +{total} LC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                          <Clock className="h-3 w-3" /> +{total} LC (pós-reunião)
                        </span>
                      )}
                    </li>
                  );
                })}

              {trainingRegs.map((r) => {
                const count = Math.max(1, countParticipants(r.participantes));
                const total = calcTrainingCoins(count);
                return (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{trainingTitle(r.training_id)}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>
                            {count} membro(s) ({r.participantes}) ·
                          </span>
                          <CoinPerPersonTag
                            perMember={CREDITS_PER_TRAINING_MEMBER}
                            perEvent={CREDITS_PER_TRAINING_EVENT}
                            className="text-amber-600"
                          />
                        </div>
                      </div>
                    </div>
                    {r.moedas_liberadas ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> +{total} LC
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                        <Clock className="h-3 w-3" /> +{total} LC (pós-evento)
                      </span>
                    )}
                  </li>
                );
              })}

              {staffVols.map((v) => {
                const count = Math.max(1, countParticipants(v.participantes));
                const total = calcStaffCoins(count);
                return (
                  <li key={v.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent/15 p-2 text-accent">
                        <HandHelping className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Staff: {callTitle(v.call_id)}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>
                            {count} voluntário(s) ({v.participantes}) ·
                          </span>
                          <CoinPerPersonTag
                            perMember={CREDITS_PER_STAFF_MEMBER}
                            perEvent={CREDITS_PER_STAFF_EVENT}
                            className="text-amber-600"
                          />
                        </div>
                      </div>
                    </div>
                    {v.moedas_liberadas ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> +{total} LC
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                        <Clock className="h-3 w-3" /> +{total} LC (pós-evento)
                      </span>
                    )}
                  </li>
                );
              })}

              {workshops
                .filter((w) => w.status !== "rejected")
                .map((w) => {
                  const count = Math.max(1, countParticipants(w.ministrantes));
                  const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
                  const total = calcWorkshopCoins(count, isJoint);
                  return (
                    <li key={w.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-success/15 p-2 text-success">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Oficina: {w.titulo}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>
                              {count} membro(s) ({w.ministrantes})
                              {isJoint ? ` · Em conjunto (+${CREDITS_PER_JOINT_WORKSHOP_BONUS} LC)` : ""} ·
                            </span>
                            <CoinPerPersonTag
                              perMember={CREDITS_PER_WORKSHOP_MEMBER}
                              perEvent={CREDITS_PER_PEER_WORKSHOP}
                              className="text-amber-600"
                            />
                          </div>
                        </div>
                      </div>
                      {w.moedas_liberadas ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> +{total} LC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                          <Clock className="h-3 w-3" /> +{total} LC (pós-oficina)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* Sub-aba 5: Saídas */}
        <TabsContent value="saidas">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-semibold">Histórico de Usos & Resgates (Saídas)</h3>
                <p className="text-xs text-muted-foreground">
                  Benefícios resgatados e reservas de salas de reunião
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/lider/capacitacoes" search={{ tab: "reunioes-equipe" }}>
                  Reservar sala
                </Link>
              </Button>
            </div>

            {redemptions.length === 0 && reservations.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nenhum resgate ou reserva realizada ainda.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {redemptions.map((red) => (
                  <li key={red.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{red.recompensa_titulo}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDateTime(red.created_at)}
                          {red.observacao ? ` · ${red.observacao}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                        -{red.custo} LC
                      </span>
                      <StatusBadge status={red.status} />
                    </div>
                  </li>
                ))}

                {reservations.map((r) => {
                  const isCap = r.purpose === "capacitacao_geral";
                  return (
                    <li key={r.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{roomName(r.room_id)}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDateTime(r.inicio)} ·{" "}
                            {isCap ? "Oficina p/ equipes" : "Reunião de equipe"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isCap ? (
                          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                            Grátis
                          </span>
                        ) : r.status === "approved" ? (
                          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                            -{CREDITS_COST_ROOM} LC
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                            {r.status === "pending"
                              ? `-${CREDITS_COST_ROOM} LC (se aprovada)`
                              : "0 LC"}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReward} onOpenChange={(o) => !o && setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar troca de LigaCoins</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                redeem.mutate();
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">{selectedReward.titulo}</div>
                <p className="mt-1 text-xs text-muted-foreground">{selectedReward.descricao}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                  <Coins className="h-3.5 w-3.5" /> Investimento: {selectedReward.custo} LigaCoins
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Detalhes / Preferência da equipe (opcional)</Label>
                <Input
                  placeholder="Ex.: Tema de mentoria desejado, data sugerida ou link do post..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={redeem.isPending}>
                  Solicitar benefício (-{selectedReward.custo} LC)
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
