import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  DoorOpen,
  GraduationCap,
  HandHelping,
  Handshake,
  History,
  Lightbulb,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CoinPerPersonTag, PageHeader, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  countParticipants,
  CREDITS_COST_ROOM,
  CREDITS_PER_JOINT_WORKSHOP_BONUS,
  CREDITS_PER_PEER_WORKSHOP,
  CREDITS_PER_STAFF_EVENT,
  CREDITS_PER_STAFF_MEMBER,
  CREDITS_PER_TRAINING_EVENT,
  CREDITS_PER_TRAINING_MEMBER,
  CREDITS_PER_WORKSHOP_MEMBER,
  entitiesQuery,
  membersQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  roomBusyQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
  type Member,
  type StaffCall,
  type Training,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/capacitacoes")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Atividades & Salas — Liga UNI" }] }),
  component: LiderAtividadesESalasPage,
});

function parseSelectedNames(str: string): string[] {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Collapsible card at the bottom of the list that reveals past/completed activities in grey.
 */
function PastActivitiesCollapsible({
  count,
  label = "Eventos já realizados",
  children,
}: {
  count: number;
  label?: string;
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
          <span>{open ? "Ocultar realizados" : "Ver realizados"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && <div className="space-y-3 border-t border-border/60 p-4">{children}</div>}
    </div>
  );
}

function MemberMultiSelector({
  members,
  selectedNames,
  onChange,
  coinsPerMember,
  coinsPerEvent,
  extraBonus = 0,
  extraBonusLabel,
}: {
  members: Member[];
  selectedNames: string[];
  onChange: (next: string[]) => void;
  coinsPerMember: number;
  coinsPerEvent: number;
  extraBonus?: number;
  extraBonusLabel?: string;
}) {
  const toggleName = (nome: string) => {
    if (selectedNames.includes(nome)) {
      onChange(selectedNames.filter((n) => n !== nome));
    } else {
      onChange([...selectedNames, nome]);
    }
  };

  const selectAll = () => onChange(members.map((m) => m.nome));
  const clearAll = () => onChange([]);

  const totalCoins =
    selectedNames.length > 0
      ? coinsPerEvent + selectedNames.length * coinsPerMember + extraBonus
      : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Selecione os membros da equipe presentes</Label>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="font-medium text-primary hover:underline"
          >
            Selecionar todos
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-muted-foreground hover:underline"
          >
            Limpar
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg border p-3 text-xs text-muted-foreground">
          Nenhum membro cadastrado na equipe ainda. Clique no nome do seu projeto na barra lateral
          para cadastrar membros.
        </p>
      ) : (
        <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border bg-muted/20 p-2.5">
          {members.map((m) => {
            const checked = selectedNames.includes(m.nome);
            return (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                  checked ? "border-primary bg-primary/5 font-medium" : "bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={checked} onCheckedChange={() => toggleName(m.nome)} />
                  <div>
                    <div className="text-foreground">{m.nome}</div>
                    {m.curso && <div className="text-[11px] text-muted-foreground">{m.curso}</div>}
                  </div>
                </div>
                <CoinPerPersonTag
                  perMember={coinsPerMember}
                  className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600"
                />
              </label>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          <b>{selectedNames.length}</b> membro(s) × {coinsPerMember} LC + {coinsPerEvent} LC
          {extraBonus > 0 ? ` + ${extraBonus} LC (${extraBonusLabel || "parceria"})` : ""}
        </span>
        <span className="inline-flex items-center gap-1 font-display text-sm font-bold text-amber-600">
          <Coins className="h-3.5 w-3.5" /> +{totalCoins} LigaCoins
        </span>
      </div>
    </div>
  );
}

type SubTabKey = "capacitacoes" | "staff" | "oficinas" | "reunioes-equipe";

function LiderAtividadesESalasPage() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: calls = [] } = useQuery(staffCallsQuery);
  const { data: myWorkshops = [] } = useQuery({
    ...peerWorkshopsQuery(entity?.id),
    enabled: !!entity?.id,
  });
  const { data: myReservations = [] } = useQuery({
    ...reservationsQuery(entity?.id),
    enabled: !!entity?.id,
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const activeSection: SubTabKey | null =
    search.tab === "capacitacoes" ||
    search.tab === "staff" ||
    search.tab === "oficinas" ||
    search.tab === "reunioes-equipe"
      ? search.tab
      : null;

  const now = new Date();
  const upcomingTrainingsCount = trainings.filter(
    (t) => t.ativa && new Date(t.fim) >= now,
  ).length;
  const upcomingCallsCount = calls.filter((c) => c.ativa && new Date(c.fim) >= now).length;
  const pendingResCount = myReservations.filter((r) => r.status === "pending").length;

  const sectionMeta: Record<SubTabKey, { title: string; subtitle: string }> = {
    capacitacoes: {
      title: "Capacitações UNI",
      subtitle:
        "Formações práticas e gratuitas oferecidas pelo Liga Ágora, empresas residentes e pelas próprias entidades estudantis para desenvolver habilidades técnicas, gestão e liderança nas equipes.",
    },
    staff: {
      title: "Auxílio de Staff em Eventos",
      subtitle:
        "Apoio colaborativo das entidades estudantis na organização de grandes eventos realizados pelo Liga Ágora no Ágora Tech Park (como Hackathons, Mostras Tecnológicas, credenciamento, recepção e suporte de palco).",
    },
    oficinas: {
      title: "Oferecer Oficina para Equipes",
      subtitle:
        "Compartilhe conhecimentos técnicos ou práticos da sua entidade com todas as demais equipes do Liga UNI reservando uma sala do Ágora Tech Park gratuitamente.",
    },
    "reunioes-equipe": {
      title: "Reuniões de Equipe (Reserva de Sala)",
      subtitle:
        "Solicite salas de reunião ou espaços compartilhados do Ágora Tech Park para encontros internos, alinhamentos de subsistemas e trabalho da sua equipe.",
    },
  };

  if (activeSection) {
    const meta = sectionMeta[activeSection];
    return (
      <>
        <div className="mb-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs text-muted-foreground">
            <Link to="/lider/capacitacoes">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar para Atividades & Salas
            </Link>
          </Button>
        </div>

        <PageHeader title={meta.title} description={meta.subtitle} />

        {activeSection === "capacitacoes" && <LiderCapacitacoesSubTab entityId={entity.id} />}
        {activeSection === "staff" && <LiderStaffSubTab entityId={entity.id} />}
        {activeSection === "oficinas" && (
          <LiderOficinasSubTab entityId={entity.id} userId={user.id} />
        )}
        {activeSection === "reunioes-equipe" && (
          <LiderReunioesEquipeSubTab entityId={entity.id} userId={user.id} />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Atividades & Salas"
        description="Escolha uma seção abaixo ou pelo menu lateral para acessar Capacitações UNI, Auxílio de Staff, Oferecer Oficina ou Reservar Sala para Reuniões de Equipe."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Card 1: Capacitações UNI */}
        <Link
          to="/lider/capacitacoes"
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
              As <b>Capacitações UNI</b> são formações práticas e gratuitas oferecidas pela
              coordenação do <b>Liga Ágora</b>, empresas residentes e pelas próprias entidades
              estudantis para desenvolver habilidades técnicas, gestão e liderança nas equipes.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
            <span>{upcomingTrainingsCount} próxima(s) capacitação(ões)</span>
            <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
              Acessar Capacitações UNI <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Card 2: Staff */}
        <Link
          to="/lider/capacitacoes"
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
              O <b>Auxílio de Staff</b> é o apoio colaborativo das entidades estudantis na
              organização de grandes eventos realizados pelo <b>Liga Ágora</b> no Ágora Tech Park
              (como Hackathons, Mostras Tecnológicas, credenciamento, recepção e suporte de palco).
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
            <span>{upcomingCallsCount} próximo(s) evento(s) precisando de staff</span>
            <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
              Acessar Staff <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Card 3: Oferecer Oficina */}
        <Link
          to="/lider/capacitacoes"
          search={{ tab: "oficinas" }}
          className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success transition group-hover:bg-success group-hover:text-white">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                  Sala Grátis
                </span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_WORKSHOP_MEMBER}
                  perEvent={CREDITS_PER_PEER_WORKSHOP}
                  className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-600"
                />
              </div>
            </div>

            <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
              Oferecer Oficina
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              As <b>Oficinas entre Equipes</b> permitem que sua entidade compartilhe conhecimentos
              técnicos ou práticos com todas as demais equipes do <b>Liga UNI</b> reservando uma
              sala do Ágora Tech Park gratuitamente. Você também pode realizar em conjunto com outro
              projeto para somar bônus de parceria.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
            <span>{myWorkshops.length} oficina(s) enviada(s) pela sua equipe</span>
            <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
              Acessar Oferecer Oficina <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Card 4: Reuniões de Equipe */}
        <Link
          to="/lider/capacitacoes"
          search={{ tab: "reunioes-equipe" }}
          className="group flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/50 hover:shadow-lg"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <DoorOpen className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">
                -{CREDITS_COST_ROOM} <Coins className="h-3.5 w-3.5" />
              </span>
            </div>

            <h3 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
              Reuniões de Equipe (Reserva de Sala)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Solicite salas de reunião ou espaços compartilhados do <b>Ágora Tech Park</b> para
              encontros internos, alinhamentos de subsistemas e trabalho da sua equipe.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold text-primary">
            <span>
              {pendingResCount > 0
                ? `${pendingResCount} reserva(s) pendente(s)`
                : "4 salas disponíveis no Ágora"}
            </span>
            <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
              Reservar Sala <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>
    </>
  );
}

export function LiderCapacitacoesSubTab({ entityId }: { entityId: string }) {
  const qc = useQueryClient();
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: myRegs = [] } = useQuery(trainingRegistrationsQuery(entityId));
  const { data: members = [] } = useQuery(membersQuery(entityId));

  const [selected, setSelected] = useState<Training | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  const register = useMutation({
    mutationFn: async () => {
      if (!selected) return 0;
      if (selectedNames.length === 0) {
        throw new Error("Selecione pelo menos um membro participante.");
      }
      const participantes = selectedNames.join(", ");
      const existing = myRegs.find((r) => r.training_id === selected.id);
      if (existing) {
        const { error } = await supabase
          .from("training_registrations")
          .update({ participantes })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training_registrations").insert({
          training_id: selected.id,
          entity_id: entityId,
          participantes,
          moedas_liberadas: false,
        });
        if (error) throw error;
      }
      return calcTrainingCoins(selectedNames.length);
    },
    onSuccess: (totalCoins) => {
      setSelected(null);
      setSelectedNames([]);
      toast.success(
        `Participantes salvos! Após a capacitação, o administrador validará +${totalCoins} LigaCoins para sua equipe.`,
      );
      qc.invalidateQueries({ queryKey: ["training-registrations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cancelReg = useMutation({
    mutationFn: async (regId: string) => {
      const { error } = await supabase.from("training_registrations").delete().eq("id", regId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição cancelada");
      qc.invalidateQueries({ queryKey: ["training-registrations"] });
    },
  });

  const now = new Date();
  const activeTrainings = trainings.filter((t) => t.ativa);

  // Mais antigos que ainda não aconteceram primeiro (ordem cronológica ascendente)
  const upcomingTrainings = activeTrainings
    .filter((t) => new Date(t.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  // Eventos que já aconteceram
  const pastTrainings = trainings
    .filter((t) => new Date(t.fim) < now || !t.ativa)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const renderTrainingHorizontalCard = (t: Training, isPast: boolean) => {
    const myReg = myRegs.find((r) => r.training_id === t.id);
    const count = myReg ? Math.max(1, countParticipants(myReg.participantes)) : 0;
    const earnedCoins = calcTrainingCoins(count);
    const isEnrolledUpcoming = Boolean(myReg && !isPast);
    const isCredited = Boolean(myReg && isPast && myReg.moedas_liberadas);

    return (
      <Card
        key={t.id}
        className={`transition ${
          isPast
            ? "border-border/60 bg-muted/40 text-muted-foreground opacity-75"
            : isEnrolledUpcoming
              ? "border-2 border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
              : ""
        }`}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isPast
                  ? "bg-muted text-muted-foreground"
                  : isEnrolledUpcoming
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-primary/10 text-primary"
              }`}
            >
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-semibold text-base leading-snug ${
                    isPast ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {t.titulo}
                </h3>
                {isPast && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Realizada
                  </span>
                )}
                {isEnrolledUpcoming && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Inscrito
                  </span>
                )}
                {myReg ? (
                  isCredited ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> +{earnedCoins} LC creditadas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                      <Coins className="h-3.5 w-3.5" /> +{earnedCoins} LC pós-evento
                    </span>
                  )
                ) : (
                  <CoinPerPersonTag
                    perMember={CREDITS_PER_TRAINING_MEMBER}
                    perEvent={CREDITS_PER_TRAINING_EVENT}
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  />
                )}
              </div>

              <p className="text-sm text-muted-foreground">{t.descricao}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {fmtDateTime(t.inicio)} – {fmtDateTime(t.fim)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {t.local}
                </span>
                <span>Ministrante: {t.ministrante}</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {t.vagas} vagas
                </span>
              </div>

              {myReg && (
                <div
                  className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                    isEnrolledUpcoming
                      ? "border-primary/30 bg-primary/5"
                      : "bg-muted/40"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      isEnrolledUpcoming ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {count} membro(s) inscrito(s) (+{earnedCoins} LigaCoins):{" "}
                  </span>
                  <span className="text-foreground">{myReg.participantes}</span>
                </div>
              )}
            </div>
          </div>

          {!isPast && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
              {myReg ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNames(parseSelectedNames(myReg.participantes));
                      setSelected(t);
                    }}
                  >
                    Editar participantes ({count})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => cancelReg.mutate(myReg.id)}>
                    Cancelar inscrição
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedNames(members.map((m) => m.nome));
                    setSelected(t);
                  }}
                >
                  Selecionar participantes
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {upcomingTrainings.length === 0 && (
        <p className="text-muted-foreground">Nenhuma próxima capacitação agendada no momento.</p>
      )}

      <div className="space-y-3">
        {upcomingTrainings.map((t) => renderTrainingHorizontalCard(t, false))}
      </div>

      <PastActivitiesCollapsible
        count={pastTrainings.length}
        label="Capacitações que já aconteceram"
      >
        {pastTrainings.map((t) => renderTrainingHorizontalCard(t, true))}
      </PastActivitiesCollapsible>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar membros para a capacitação</DialogTitle>
          </DialogHeader>
          {selected && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                register.mutate();
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">{selected.titulo}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(selected.inicio)} · {selected.local}
                </div>
              </div>

              <MemberMultiSelector
                members={members}
                selectedNames={selectedNames}
                onChange={setSelectedNames}
                coinsPerMember={CREDITS_PER_TRAINING_MEMBER}
                coinsPerEvent={CREDITS_PER_TRAINING_EVENT}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={register.isPending || selectedNames.length === 0}
                >
                  Confirmar ({selectedNames.length} membro(s))
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LiderStaffSubTab({ entityId }: { entityId: string }) {
  const qc = useQueryClient();
  const { data: calls = [] } = useQuery(staffCallsQuery);
  const { data: myVols = [] } = useQuery(staffVolunteersQuery(entityId));
  const { data: members = [] } = useQuery(membersQuery(entityId));

  const [selected, setSelected] = useState<StaffCall | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");

  const offerHelp = useMutation({
    mutationFn: async () => {
      if (!selected) return 0;
      if (selectedNames.length === 0) {
        throw new Error("Selecione pelo menos um membro voluntário.");
      }
      const participantes = selectedNames.join(", ");
      const existing = myVols.find((v) => v.call_id === selected.id);
      if (existing) {
        const { error } = await supabase
          .from("staff_volunteers")
          .update({ participantes, observacao })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_volunteers").insert({
          call_id: selected.id,
          entity_id: entityId,
          participantes,
          observacao,
          moedas_liberadas: false,
        });
        if (error) throw error;
      }
      return calcStaffCoins(selectedNames.length);
    },
    onSuccess: (totalCoins) => {
      setSelected(null);
      setSelectedNames([]);
      setObservacao("");
      toast.success(
        `Voluntários registrados! Após o evento, o administrador liberará +${totalCoins} LigaCoins para sua entidade.`,
      );
      qc.invalidateQueries({ queryKey: ["staff-volunteers"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cancelHelp = useMutation({
    mutationFn: async (volId: string) => {
      const { error } = await supabase.from("staff_volunteers").delete().eq("id", volId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Participação como staff removida");
      qc.invalidateQueries({ queryKey: ["staff-volunteers"] });
    },
  });

  const now = new Date();
  const upcomingCalls = calls
    .filter((c) => c.ativa && new Date(c.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  const pastCalls = calls
    .filter((c) => new Date(c.fim) < now || !c.ativa)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const renderStaffHorizontalCard = (c: StaffCall, isPast: boolean) => {
    const myVol = myVols.find((v) => v.call_id === c.id);
    const count = myVol ? Math.max(1, countParticipants(myVol.participantes)) : 0;
    const earnedCoins = calcStaffCoins(count);
    const isEnrolledUpcoming = Boolean(myVol && !isPast);
    const isCredited = Boolean(myVol && isPast && myVol.moedas_liberadas);

    return (
      <Card
        key={c.id}
        className={`transition ${
          isPast
            ? "border-border/60 bg-muted/40 text-muted-foreground opacity-75"
            : isEnrolledUpcoming
              ? "border-2 border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
              : ""
        }`}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isPast
                  ? "bg-muted text-muted-foreground"
                  : isEnrolledUpcoming
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-accent/15 text-accent"
              }`}
            >
              <HandHelping className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-semibold text-base leading-snug ${
                    isPast ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {c.evento}
                </h3>
                {isPast && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Realizado
                  </span>
                )}
                {isEnrolledUpcoming && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Inscrito
                  </span>
                )}
                {myVol ? (
                  isCredited ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> +{earnedCoins} LC creditadas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                      <Coins className="h-3.5 w-3.5" /> +{earnedCoins} LC pós-evento
                    </span>
                  )
                ) : (
                  <CoinPerPersonTag
                    perMember={CREDITS_PER_STAFF_MEMBER}
                    perEvent={CREDITS_PER_STAFF_EVENT}
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  />
                )}
              </div>

              <p className="text-sm text-muted-foreground">{c.descricao}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {fmtDateTime(c.inicio)} – {fmtDateTime(c.fim)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {c.local}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Necessidade: {c.vagas} voluntários
                </span>
              </div>

              {myVol && (
                <div
                  className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                    isEnrolledUpcoming
                      ? "border-primary/30 bg-primary/5"
                      : "bg-muted/40"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      isEnrolledUpcoming ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {count} voluntário(s) inscrito(s) (+{earnedCoins} LigaCoins):{" "}
                  </span>
                  <span className="text-foreground">{myVol.participantes}</span>
                  {myVol.observacao && (
                    <span className="ml-2 italic text-muted-foreground">
                      (Obs: {myVol.observacao})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isPast && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
              {myVol ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNames(parseSelectedNames(myVol.participantes));
                      setObservacao(myVol.observacao);
                      setSelected(c);
                    }}
                  >
                    Editar participantes ({count})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => cancelHelp.mutate(myVol.id)}>
                    Cancelar apoio
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedNames(members.slice(0, 2).map((m) => m.nome));
                    setObservacao("");
                    setSelected(c);
                  }}
                >
                  <HandHelping className="mr-1.5 h-4 w-4" />
                  <span>Selecionar Staff</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {upcomingCalls.length === 0 && (
        <p className="text-muted-foreground">
          Nenhum próximo evento precisando de auxílio de staff no momento.
        </p>
      )}

      <div className="space-y-3">
        {upcomingCalls.map((c) => renderStaffHorizontalCard(c, false))}
      </div>

      <PastActivitiesCollapsible
        count={pastCalls.length}
        label="Eventos de Staff que já aconteceram"
      >
        {pastCalls.map((c) => renderStaffHorizontalCard(c, true))}
      </PastActivitiesCollapsible>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar voluntários para Staff no evento</DialogTitle>
          </DialogHeader>
          {selected && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                offerHelp.mutate();
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">{selected.evento}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(selected.inicio)} · {selected.local}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{selected.descricao}</p>
              </div>

              <MemberMultiSelector
                members={members}
                selectedNames={selectedNames}
                onChange={setSelectedNames}
                coinsPerMember={CREDITS_PER_STAFF_MEMBER}
                coinsPerEvent={CREDITS_PER_STAFF_EVENT}
              />

              <div className="space-y-1.5">
                <Label>Disponibilidade / Turno / Função de preferência (opcional)</Label>
                <Input
                  placeholder="Ex.: Turno da manhã, recepção, suporte técnico..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={offerHelp.isPending || selectedNames.length === 0}
                >
                  Confirmar ({selectedNames.length} voluntário(s))
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LiderOficinasSubTab({
  entityId,
  userId,
}: {
  entityId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const { data: myWorkshops = [] } = useQuery(peerWorkshopsQuery(entityId));
  const { data: members = [] } = useQuery(membersQuery(entityId));
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: allEntities = [] } = useQuery(entitiesQuery);

  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [emConjunto, setEmConjunto] = useState(false);
  const [partnerEntityId, setPartnerEntityId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [dataOficina, setDataOficina] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [descricao, setDescricao] = useState("");

  const activeRooms = rooms.filter((r) => r.ativa);
  const partnerEntities = allEntities.filter((e) => e.id !== entityId);
  const roomName = (id?: string | null) =>
    id ? (rooms.find((r) => r.id === id)?.nome ?? "Sala do Ágora") : "Sala do Ágora";
  const entityName = (id?: string | null) =>
    id ? (allEntities.find((e) => e.id === id)?.nome ?? "Projeto parceiro") : null;

  const isJointValid = Boolean(emConjunto && partnerEntityId);
  const modalTotalCoins = calcWorkshopCoins(selectedNames.length, isJointValid);

  const workshopDateErrors = useMemo(() => {
    const errs: { inicio?: string; fim?: string } = {};
    if (dataOficina && horaInicio) {
      const start = new Date(`${dataOficina}T${horaInicio}`);
      if (start <= new Date()) {
        errs.inicio = "O horário de início deve ser no futuro.";
      }
    }
    if (dataOficina && horaInicio && horaFim) {
      if (horaFim <= horaInicio) {
        errs.fim =
          "O horário de término deve ser após o início no mesmo dia. Para mais de um dia, envie solicitações separadas.";
      }
    }
    return errs;
  }, [dataOficina, horaInicio, horaFim]);

  const create = useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error("Selecione a sala do Ágora para realizar a oficina.");
      if (selectedNames.length === 0) {
        throw new Error("Selecione pelo menos um membro da equipe presente na oficina.");
      }
      if (emConjunto && !partnerEntityId) {
        throw new Error("Selecione qual projeto parceiro realizará a oficina em conjunto.");
      }
      if (!dataOficina || !horaInicio || !horaFim) {
        throw new Error("Informe o dia, horário de início e horário de término.");
      }
      if (workshopDateErrors.inicio) throw new Error(workshopDateErrors.inicio);
      if (workshopDateErrors.fim) throw new Error(workshopDateErrors.fim);

      const startIso = new Date(`${dataOficina}T${horaInicio}`).toISOString();
      const endIso = new Date(`${dataOficina}T${horaFim}`).toISOString();

      if (new Date(endIso) <= new Date(startIso)) {
        throw new Error("O término da oficina deve ser após o início no mesmo dia.");
      }

      const ministrantes = selectedNames.join(", ");

      const { error } = await supabase.from("peer_workshops").insert({
        entity_id: entityId,
        room_id: roomId,
        titulo,
        ministrantes,
        em_conjunto: emConjunto,
        partner_entity_id: emConjunto ? partnerEntityId : null,
        data_sugerida: startIso,
        fim: endIso,
        descricao,
        status: "pending",
        moedas_liberadas: false,
      });
      if (error) throw error;

      // Solicita automaticamente a reserva gratuita da sala vinculada à oficina
      await supabase.from("reservations").insert({
        room_id: roomId,
        purpose: "capacitacao_geral",
        event_id: null,
        entity_id: entityId,
        requested_by: userId,
        inicio: startIso,
        fim: endIso,
        motivo: `Oficina para equipes: ${titulo}`,
      });

      return calcWorkshopCoins(selectedNames.length, Boolean(emConjunto && partnerEntityId));
    },
    onSuccess: (totalCoins) => {
      setOpen(false);
      setTitulo("");
      setSelectedNames([]);
      setEmConjunto(false);
      setPartnerEntityId("");
      setRoomId("");
      setDataOficina("");
      setHoraInicio("");
      setHoraFim("");
      setDescricao("");
      toast.success(
        `Oficina e reserva gratuita da sala enviadas! Quando o administrador aprovar, todos os líderes receberão um aviso por e-mail (+${totalCoins} LC após o evento).`,
      );
      qc.invalidateQueries({ queryKey: ["peer-workshops"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("peer_workshops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposta de oficina removida");
      qc.invalidateQueries({ queryKey: ["peer-workshops"] });
    },
  });

  const now = new Date();
  const isWorkshopPast = (w: (typeof myWorkshops)[number]) => {
    const endRef = w.fim || w.data_sugerida;
    return new Date(endRef) < now || w.moedas_liberadas;
  };

  // Mais antigas que ainda não aconteceram em cima
  const upcomingWorkshops = myWorkshops
    .filter((w) => !isWorkshopPast(w))
    .sort((a, b) => new Date(a.data_sugerida).getTime() - new Date(b.data_sugerida).getTime());

  // Oficinas que já aconteceram
  const pastWorkshops = myWorkshops
    .filter((w) => isWorkshopPast(w))
    .sort((a, b) => new Date(b.data_sugerida).getTime() - new Date(a.data_sugerida).getTime());

  const renderWorkshopHorizontalCard = (
    w: (typeof myWorkshops)[number],
    isPast: boolean,
  ) => {
    const count = Math.max(1, countParticipants(w.ministrantes));
    const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
    const totalCoins = calcWorkshopCoins(count, isJoint);
    const partnerName = entityName(w.partner_entity_id);
    const isEnrolledUpcoming = !isPast && w.status !== "rejected";
    const isCredited = Boolean(isPast && w.moedas_liberadas);

    return (
      <Card
        key={w.id}
        className={`transition ${
          isPast
            ? "border-border/60 bg-muted/40 text-muted-foreground opacity-75"
            : isEnrolledUpcoming
              ? "border-2 border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
              : ""
        }`}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isPast
                  ? "bg-muted text-muted-foreground"
                  : isEnrolledUpcoming
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-success/15 text-success"
              }`}
            >
              <Lightbulb className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-semibold text-base leading-snug ${
                    isPast ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {w.titulo}
                </h3>
                {isPast && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Realizada
                  </span>
                )}
                {isEnrolledUpcoming && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Inscrito
                  </span>
                )}
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                  Sala Grátis
                </span>
                {isCredited ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                    <CheckCircle2 className="h-3 w-3" /> +{totalCoins} LC creditadas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
                    <Coins className="h-3 w-3" /> +{totalCoins} LC pós-evento
                  </span>
                )}
                <StatusBadge status={w.status} />
              </div>

              {isJoint && partnerName && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Handshake className="h-3.5 w-3.5" /> Em conjunto com: <b>{partnerName}</b> (+
                  {CREDITS_PER_JOINT_WORKSHOP_BONUS} LC bônus)
                </div>
              )}

              <p className="text-sm text-muted-foreground">{w.descricao}</p>
              {w.admin_note && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                  <b>Justificativa do administrador:</b> {w.admin_note}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
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
            <Button variant="ghost" size="sm" onClick={() => remove.mutate(w.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (selectedNames.length === 0 && members.length > 0) {
                  setSelectedNames(members.slice(0, 2).map((m) => m.nome));
                }
              }}
            >
              <Plus />
              <span>Propor oficina (Sala Grátis)</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Oferecer oficina para outras equipes (Sala Grátis)</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label>Título da oficina</Label>
                <Input
                  required
                  placeholder="Ex.: Introdução a Soldagem Eletrônica e PCBs"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <MemberMultiSelector
                members={members}
                selectedNames={selectedNames}
                onChange={setSelectedNames}
                coinsPerMember={CREDITS_PER_WORKSHOP_MEMBER}
                coinsPerEvent={CREDITS_PER_PEER_WORKSHOP}
                extraBonus={isJointValid ? CREDITS_PER_JOINT_WORKSHOP_BONUS : 0}
                extraBonusLabel="em conjunto"
              />

              {/* Opção de evento em conjunto com outro projeto */}
              <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold">
                        Oficina em conjunto com outro projeto?
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Eventos colaborativos entre projetos rendem bônus extra
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                      +{CREDITS_PER_JOINT_WORKSHOP_BONUS} <Coins className="h-3 w-3" />
                    </span>
                    <Switch
                      checked={emConjunto}
                      onCheckedChange={(v) => {
                        setEmConjunto(v);
                        if (!v) setPartnerEntityId("");
                      }}
                    />
                  </div>
                </div>

                {emConjunto && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs">Selecione o projeto parceiro</Label>
                    <Select value={partnerEntityId} onValueChange={setPartnerEntityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o projeto parceiro..." />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerEntities.map((pe) => (
                          <SelectItem key={pe.id} value={pe.id}>
                            {pe.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Sala do Ágora para a oficina</Label>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                    Grátis
                  </span>
                </div>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome} · {r.capacidade} pessoas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
                <div className="space-y-1.5">
                  <Label>Dia da oficina / capacitação</Label>
                  <Input
                    type="date"
                    required
                    value={dataOficina}
                    onChange={(e) => setDataOficina(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Horário de início</Label>
                    <Input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horário de término</Label>
                    <Input
                      type="time"
                      required
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                    />
                  </div>
                </div>
                {workshopDateErrors.inicio && (
                  <p className="text-xs text-destructive">{workshopDateErrors.inicio}</p>
                )}
                {workshopDateErrors.fim && (
                  <p className="text-xs text-destructive">{workshopDateErrors.fim}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Cada solicitação corresponde a 1 único dia. Caso precise de mais de um dia, envie
                  2 solicitações separadas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>O que será ensinado</Label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Descreva o conteúdo prático que sua equipe vai compartilhar com os outros projetos..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Assim que a oficina for aprovada pelo Admin, todos os líderes receberão um aviso
                  por e-mail para inscreverem suas equipes.
                </span>
              </div>

              <Button
                className="w-full"
                disabled={
                  create.isPending ||
                  selectedNames.length === 0 ||
                  Boolean(workshopDateErrors.inicio) ||
                  Boolean(workshopDateErrors.fim)
                }
              >
                Enviar oficina e reservar sala Grátis
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingWorkshops.length === 0 && (
        <p className="text-muted-foreground">
          Nenhuma próxima oficina agendada pela sua entidade no momento.
        </p>
      )}

      <div className="space-y-3">
        {upcomingWorkshops.map((w) => renderWorkshopHorizontalCard(w, false))}
      </div>

      <PastActivitiesCollapsible
        count={pastWorkshops.length}
        label="Oficinas que já aconteceram"
      >
        {pastWorkshops.map((w) => renderWorkshopHorizontalCard(w, true))}
      </PastActivitiesCollapsible>
    </div>
  );
}

export function LiderReunioesEquipeSubTab({
  entityId,
  userId,
}: {
  entityId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: res = [] } = useQuery(reservationsQuery(entityId));

  const [f, setF] = useState<{
    room_id: string;
    data: string;
    horaInicio: string;
    horaFim: string;
    motivo: string;
  }>({
    room_id: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    motivo: "",
  });

  const { fromIso, toIso } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 90 * 86400000);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }, []);

  const { data: busySlots = [] } = useQuery({
    ...roomBusyQuery(f.room_id, fromIso, toIso),
    enabled: !!f.room_id,
  });

  const dateErrors = useMemo(() => {
    const errs: { inicio?: string; fim?: string } = {};
    if (f.data && f.horaInicio) {
      const start = new Date(`${f.data}T${f.horaInicio}`);
      if (start <= new Date()) {
        errs.inicio = "O horário de início deve ser no futuro.";
      }
    }
    if (f.data && f.horaInicio && f.horaFim) {
      if (f.horaFim <= f.horaInicio) {
        errs.fim =
          "O horário de término deve ser após o início no mesmo dia. Para mais de um dia, envie solicitações separadas.";
      }
    }
    return errs;
  }, [f.data, f.horaInicio, f.horaFim]);

  const hasOverlap = useMemo(() => {
    if (!f.data || !f.horaInicio || !f.horaFim) return false;
    if (f.horaFim <= f.horaInicio) return false;
    const start = new Date(`${f.data}T${f.horaInicio}`);
    const end = new Date(`${f.data}T${f.horaFim}`);
    return busySlots.some((b) => new Date(b.inicio) < end && new Date(b.fim) > start);
  }, [f.data, f.horaInicio, f.horaFim, busySlots]);

  const create = useMutation({
    mutationFn: async () => {
      if (!f.room_id) throw new Error("Escolha uma sala");
      if (!f.data || !f.horaInicio || !f.horaFim) {
        throw new Error("Informe o dia, horário de início e horário de término.");
      }
      if (dateErrors.inicio) throw new Error(dateErrors.inicio);
      if (dateErrors.fim) throw new Error(dateErrors.fim);
      const startIso = new Date(`${f.data}T${f.horaInicio}`).toISOString();
      const endIso = new Date(`${f.data}T${f.horaFim}`).toISOString();
      const { error } = await supabase.from("reservations").insert({
        room_id: f.room_id,
        purpose: "reuniao_projeto",
        event_id: null,
        entity_id: entityId,
        requested_by: userId,
        inicio: startIso,
        fim: endIso,
        motivo: f.motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        `Solicitação de sala para reunião enviada! (-${CREDITS_COST_ROOM} LigaCoins quando aprovada)`,
      );
      setF({
        room_id: "",
        data: "",
        horaInicio: "",
        horaFim: "",
        motivo: "",
      });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["room-busy"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação cancelada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.nome ?? "—";
  const activeRooms = rooms.filter((r) => r.ativa);

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Reservar sala para reunião da equipe</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600">
              -{CREDITS_COST_ROOM} <Coins className="h-3.5 w-3.5" />
            </span>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (dateErrors.inicio || dateErrors.fim) return;
              create.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>Sala disponível no Ágora</Label>
              <Select value={f.room_id} onValueChange={(v) => setF({ ...f, room_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  {activeRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome} · {r.capacidade} pessoas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {f.room_id && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <div className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Horários já reservados (aprovados)
                </div>
                {busySlots.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum horário ocupado nos próximos dias.</p>
                ) : (
                  <ul className="max-h-28 space-y-1 overflow-y-auto text-muted-foreground">
                    {busySlots.map((b, idx) => (
                      <li key={idx}>
                        {fmtDateTime(b.inicio)} até {fmtDateTime(b.fim)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Dia da reunião</Label>
                <Input
                  type="date"
                  required
                  value={f.data}
                  onChange={(e) => setF({ ...f, data: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Horário de início</Label>
                  <Input
                    type="time"
                    required
                    value={f.horaInicio}
                    onChange={(e) => setF({ ...f, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário de término</Label>
                  <Input
                    type="time"
                    required
                    value={f.horaFim}
                    onChange={(e) => setF({ ...f, horaFim: e.target.value })}
                  />
                </div>
              </div>
              {dateErrors.inicio && (
                <p className="text-xs text-destructive">{dateErrors.inicio}</p>
              )}
              {dateErrors.fim && <p className="text-xs text-destructive">{dateErrors.fim}</p>}
              <p className="text-[11px] text-muted-foreground">
                Cada solicitação vale para 1 único dia. Se precisar de mais de um dia, faça 2
                solicitações.
              </p>
            </div>

            {hasOverlap && (
              <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/15 p-3 text-xs text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Atenção: o horário escolhido conflita com uma reserva já aprovada nesta sala. Você
                  ainda pode enviar a solicitação para avaliação do administrador.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Objetivo da reunião da equipe</Label>
              <Textarea
                required
                placeholder="Descreva a pauta ou objetivo da reunião interna do seu projeto..."
                value={f.motivo}
                onChange={(e) => setF({ ...f, motivo: e.target.value })}
              />
            </div>

            <Button
              className="w-full"
              disabled={create.isPending || Boolean(dateErrors.inicio) || Boolean(dateErrors.fim)}
            >
              Solicitar sala para reunião
            </Button>
          </form>
        </Card>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sala & Finalidade</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {res.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma solicitação de sala ainda.
                  </TableCell>
                </TableRow>
              )}
              {res.map((r) => {
                const isOficina = r.purpose === "capacitacao_geral";
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{roomName(r.room_id)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isOficina
                              ? "bg-success/15 text-success"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isOficina ? "Oficina p/ equipes" : "Reunião de equipe"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{r.motivo}</div>
                      {r.admin_note && (
                        <div className="mt-1 text-xs italic text-muted-foreground">
                          Observação do admin: {r.admin_note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fmtDateTime(r.inicio)}
                      <br />
                      {fmtDateTime(r.fim)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs font-semibold">
                      {isOficina ? (
                        <span className="text-success">Grátis</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          -{CREDITS_COST_ROOM} <Coins className="h-3 w-3" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancel.mutate(r.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
