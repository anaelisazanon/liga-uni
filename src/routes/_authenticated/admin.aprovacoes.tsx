import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader, StatusBadge } from "@/components/AppShell";
import { AdminActionLog } from "@/components/AdminActionLog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appendAdminActionLog,
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  countParticipants,
  CREDITS_COST_ROOM,
  CREDITS_PER_JOINT_WORKSHOP_BONUS,
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
    <div className="mt-4 rounded-xl border border-border/80 bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            {label} ({count})
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span>{open ? "Ocultar concluídos" : "Ver concluídos"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && <div className="divide-y divide-border/60 border-t border-border/60">{children}</div>}
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

  const [queryText, setQueryText] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const entityName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "Entidade";
  const roomName = (id?: string | null) =>
    id ? (rooms.find((r) => r.id === id)?.nome ?? "Sala do Ágora") : "Sala do Ágora";

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

  // Determina a aba ativa (se não houver, abre a primeira com pendências ou "reunioes")
  const defaultTab: ApprovalTabKey = useMemo(() => {
    if (pendingAttendances.length > 0) return "reunioes";
    if (pendingTrainingRegs.length > 0) return "capacitacoes";
    if (pendingStaffVols.length > 0) return "staff";
    if (pendingWorkshops.length > 0) return "oficinas";
    if (pendingReservations.length > 0) return "reservas";
    if (pendingRedemptions.length + pendingLeaders.length > 0) return "beneficios-cadastros";
    return "reunioes";
  }, [
    pendingAttendances.length,
    pendingTrainingRegs.length,
    pendingStaffVols.length,
    pendingWorkshops.length,
    pendingReservations.length,
    pendingRedemptions.length,
    pendingLeaders.length,
  ]);

  const activeSection: ApprovalTabKey =
    search.tab === "reunioes" ||
    search.tab === "capacitacoes" ||
    search.tab === "staff" ||
    search.tab === "oficinas" ||
    search.tab === "reservas" ||
    search.tab === "beneficios-cadastros"
      ? search.tab
      : defaultTab;

  const [rejectTarget, setRejectTarget] = useState<{
    kind: "workshop" | "reservation" | "redemption" | "leader";
    id: string;
    entityId?: string;
    title: string;
    entityLabel: string;
    coins?: number;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Mutations individuais e em lote (por evento ou geral)
  const releaseMeeting = useMutation({
    mutationFn: async ({
      id,
      coins,
      itemLabel,
      entityLabel,
    }: {
      id: string;
      coins: number;
      itemLabel?: string;
      entityLabel?: string;
    }) => {
      const { error } = await supabase
        .from("meeting_attendances")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      appendAdminActionLog({
        action: "approved",
        category: "Reunião Liga UNI",
        item: itemLabel ?? "Reunião Liga UNI",
        entityLabel: entityLabel ?? "Equipe",
        coinsLabel: `+${coins} LC`,
        justification: `Presença validada pelo administrador (+${coins} LC).`,
      });
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pela presença na Reunião Liga UNI!`);
      qc.invalidateQueries({ queryKey: ["meeting-attendances"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseMeetingBatch = useMutation({
    mutationFn: async (
      items: { id: string; coins: number; itemLabel?: string; entityLabel?: string }[],
    ) => {
      for (const item of items) {
        const { error } = await supabase
          .from("meeting_attendances")
          .update({ moedas_liberadas: true })
          .eq("id", item.id);
        if (error) throw error;
        appendAdminActionLog({
          action: "approved",
          category: "Reunião Liga UNI",
          item: item.itemLabel ?? "Reunião Liga UNI",
          entityLabel: item.entityLabel ?? "Equipe",
          coinsLabel: `+${item.coins} LC`,
          justification: `Presença validada em lote pelo administrador (+${item.coins} LC).`,
        });
      }
      return {
        count: items.length,
        totalCoins: items.reduce((acc, i) => acc + i.coins, 0),
      };
    },
    onSuccess: ({ count, totalCoins }) => {
      toast.success(`${count} equipe(s) validadas (+${totalCoins} LC no total)!`);
      qc.invalidateQueries({ queryKey: ["meeting-attendances"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseTraining = useMutation({
    mutationFn: async ({
      id,
      coins,
      itemLabel,
      entityLabel,
    }: {
      id: string;
      coins: number;
      itemLabel?: string;
      entityLabel?: string;
    }) => {
      const { error } = await supabase
        .from("training_registrations")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      appendAdminActionLog({
        action: "approved",
        category: "Capacitação UNI",
        item: itemLabel ?? "Capacitação UNI",
        entityLabel: entityLabel ?? "Equipe",
        coinsLabel: `+${coins} LC`,
        justification: `Participação validada pelo administrador (+${coins} LC).`,
      });
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pela participação na Capacitação UNI!`);
      qc.invalidateQueries({ queryKey: ["training-registrations"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseTrainingBatch = useMutation({
    mutationFn: async (
      items: { id: string; coins: number; itemLabel?: string; entityLabel?: string }[],
    ) => {
      for (const item of items) {
        const { error } = await supabase
          .from("training_registrations")
          .update({ moedas_liberadas: true })
          .eq("id", item.id);
        if (error) throw error;
        appendAdminActionLog({
          action: "approved",
          category: "Capacitação UNI",
          item: item.itemLabel ?? "Capacitação UNI",
          entityLabel: item.entityLabel ?? "Equipe",
          coinsLabel: `+${item.coins} LC`,
          justification: `Participação validada em lote pelo administrador (+${item.coins} LC).`,
        });
      }
      return {
        count: items.length,
        totalCoins: items.reduce((acc, i) => acc + i.coins, 0),
      };
    },
    onSuccess: ({ count, totalCoins }) => {
      toast.success(`${count} equipe(s) validadas na capacitação (+${totalCoins} LC no total)!`);
      qc.invalidateQueries({ queryKey: ["training-registrations"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseStaff = useMutation({
    mutationFn: async ({
      id,
      coins,
      itemLabel,
      entityLabel,
    }: {
      id: string;
      coins: number;
      itemLabel?: string;
      entityLabel?: string;
    }) => {
      const { error } = await supabase
        .from("staff_volunteers")
        .update({ moedas_liberadas: true })
        .eq("id", id);
      if (error) throw error;
      appendAdminActionLog({
        action: "approved",
        category: "Staff em Evento",
        item: itemLabel ?? "Evento Ágora",
        entityLabel: entityLabel ?? "Equipe",
        coinsLabel: `+${coins} LC`,
        justification: `Auxílio de Staff validado pelo administrador (+${coins} LC).`,
      });
      return coins;
    },
    onSuccess: (c) => {
      toast.success(`+${c} LigaCoins liberadas pelo auxílio de Staff!`);
      qc.invalidateQueries({ queryKey: ["staff-volunteers"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const releaseStaffBatch = useMutation({
    mutationFn: async (
      items: { id: string; coins: number; itemLabel?: string; entityLabel?: string }[],
    ) => {
      for (const item of items) {
        const { error } = await supabase
          .from("staff_volunteers")
          .update({ moedas_liberadas: true })
          .eq("id", item.id);
        if (error) throw error;
        appendAdminActionLog({
          action: "approved",
          category: "Staff em Evento",
          item: item.itemLabel ?? "Evento Ágora",
          entityLabel: item.entityLabel ?? "Equipe",
          coinsLabel: `+${item.coins} LC`,
          justification: `Auxílio de Staff validado em lote pelo administrador (+${item.coins} LC).`,
        });
      }
      return {
        count: items.length,
        totalCoins: items.reduce((acc, i) => acc + i.coins, 0),
      };
    },
    onSuccess: ({ count, totalCoins }) => {
      toast.success(`${count} apoio(s) de Staff validados (+${totalCoins} LC no total)!`);
      qc.invalidateQueries({ queryKey: ["staff-volunteers"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const approveWorkshop = useMutation({
    mutationFn: async ({
      id,
      entityId,
      title,
      status,
      moedas_liberadas,
      coins,
      admin_note,
    }: {
      id: string;
      entityId?: string;
      title?: string;
      status: "approved" | "rejected";
      moedas_liberadas: boolean;
      coins: number;
      admin_note?: string | null;
    }) => {
      const { error } = await supabase
        .from("peer_workshops")
        .update({ status, moedas_liberadas, admin_note: admin_note ?? null })
        .eq("id", id);
      if (error) throw error;

      if (status === "rejected" && entityId && title) {
        const linkedRes = reservations.find(
          (r) =>
            r.entity_id === entityId &&
            r.purpose === "capacitacao_geral" &&
            r.motivo.includes(title.replace(/^Oficina:\s*/i, "")),
        );
        if (linkedRes) {
          await supabase
            .from("reservations")
            .update({ status: "rejected", admin_note: admin_note ?? null })
            .eq("id", linkedRes.id);
        }
        await supabase.from("admin_messages").insert({
          entity_id: entityId,
          sender_id: "user-admin",
          topico: "Capacitações & Staff",
          assunto: `Justificativa de recusa — ${title}`,
          mensagem: `Sua proposta de oficina/evento foi analisada pela coordenação do Ágora Tech Park e não pôde ser aprovada neste momento.`,
          resposta_admin: admin_note ?? "Recusado pela administração.",
          status: "approved",
        });
      }

      appendAdminActionLog({
        action: status,
        category: "Oficina de Equipe",
        item: title ?? "Oficina de Equipe",
        entityLabel: entityId ? entityName(entityId) : "Equipe",
        coinsLabel: status === "approved" && moedas_liberadas ? `+${coins} LC` : undefined,
        justification:
          status === "rejected"
            ? (admin_note ?? "Oficina recusada pela administração.")
            : moedas_liberadas
              ? `Oficina validada e +${coins} LigaCoins liberadas.`
              : "Oficina aprovada e publicada para todas as equipes.",
      });

      return { status, moedas_liberadas, coins };
    },
    onSuccess: ({ status, moedas_liberadas, coins }) => {
      if (status === "rejected") {
        toast.success(
          "Evento/oficina recusada e justificativa enviada automaticamente para a equipe responsável!",
        );
      } else if (moedas_liberadas) {
        toast.success(`Oficina validada e +${coins} LigaCoins liberadas!`);
      } else {
        toast.success("Oficina aprovada e publicada para todas as equipes!");
      }
      qc.invalidateQueries({ queryKey: ["peer-workshops"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["trainings"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideReservation = useMutation({
    mutationFn: async ({
      id,
      entityId,
      title,
      status,
      admin_note,
    }: {
      id: string;
      entityId?: string;
      title?: string;
      status: "approved" | "rejected";
      admin_note?: string | null;
    }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status, admin_note: admin_note ?? null })
        .eq("id", id);
      if (error) throw error;

      if (status === "rejected" && entityId) {
        await supabase.from("admin_messages").insert({
          entity_id: entityId,
          sender_id: "user-admin",
          topico: "Salas & Equipamentos",
          assunto: `Justificativa de recusa — ${title ?? "Reserva de Sala"}`,
          mensagem: `Sua solicitação de reserva de sala no Ágora Tech Park foi analisada pela coordenação e não pôde ser aprovada neste horário.`,
          resposta_admin: admin_note ?? "Reserva recusada pela administração.",
          status: "approved",
        });
      }

      const resObj = reservations.find((r) => r.id === id);
      appendAdminActionLog({
        action: status,
        category: "Reserva de Sala",
        item:
          title ??
          (resObj ? `${roomName(resObj.room_id)} — ${resObj.motivo}` : "Reserva de Sala"),
        entityLabel: entityId
          ? entityName(entityId)
          : resObj
            ? entityName(resObj.entity_id)
            : "Equipe",
        justification:
          status === "rejected"
            ? (admin_note ?? "Reserva recusada pela administração.")
            : "Reserva de sala aprovada pela administração.",
      });

      return status;
    },
    onSuccess: (s) => {
      toast.success(
        s === "approved"
          ? "Reserva de sala aprovada!"
          : "Reserva de sala recusada e justificativa enviada automaticamente para a equipe responsável!",
      );
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["room-busy"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const approveReservationsBatch = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase
          .from("reservations")
          .update({ status: "approved" })
          .eq("id", id);
        if (error) throw error;
        const resObj = reservations.find((r) => r.id === id);
        appendAdminActionLog({
          action: "approved",
          category: "Reserva de Sala",
          item: resObj ? `${roomName(resObj.room_id)} — ${resObj.motivo}` : "Reserva de Sala",
          entityLabel: resObj ? entityName(resObj.entity_id) : "Equipe",
          justification: "Reserva de sala aprovada em lote pela administração.",
        });
      }
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} reserva(s) de sala aprovadas!`);
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["room-busy"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideRedemption = useMutation({
    mutationFn: async ({
      id,
      entityId,
      title,
      status,
      admin_note,
    }: {
      id: string;
      entityId?: string;
      title?: string;
      status: "approved" | "rejected";
      admin_note?: string | null;
    }) => {
      const { error } = await supabase
        .from("reward_redemptions")
        .update({ status, admin_note: admin_note ?? null })
        .eq("id", id);
      if (error) throw error;

      if (status === "rejected" && entityId) {
        await supabase.from("admin_messages").insert({
          entity_id: entityId,
          sender_id: "user-admin",
          topico: "LigaCoins & Benefícios",
          assunto: `Justificativa de recusa — ${title ?? "Resgate de Benefício"}`,
          mensagem: `Sua solicitação de troca de LigaCoins na Loja de Benefícios foi analisada pela coordenação.`,
          resposta_admin: admin_note ?? "Solicitação recusada e LigaCoins estornadas.",
          status: "approved",
        });
      }

      const redObj = redemptions.find((r) => r.id === id);
      appendAdminActionLog({
        action: status,
        category: "Benefício LigaCoins",
        item: title ?? (redObj ? `Resgate: ${redObj.recompensa_titulo}` : "Resgate de Benefício"),
        entityLabel: entityId
          ? entityName(entityId)
          : redObj
            ? entityName(redObj.entity_id)
            : "Equipe",
        coinsLabel: redObj ? `-${redObj.custo} LC` : undefined,
        justification:
          status === "rejected"
            ? (admin_note ?? "Solicitação recusada e LigaCoins estornadas.")
            : "Resgate de benefício aprovado pela administração.",
      });

      return status;
    },
    onSuccess: (s) => {
      toast.success(
        s === "approved"
          ? "Resgate de benefício aprovado!"
          : "Solicitação de resgate recusada e justificativa enviada para a equipe (LigaCoins estornadas).",
      );
      qc.invalidateQueries({ queryKey: ["reward-redemptions"] });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decideLeader = useMutation({
    mutationFn: async ({
      id,
      status,
      admin_note,
    }: {
      id: string;
      status: "approved" | "rejected";
      admin_note?: string | null;
    }) => {
      const { error } = await supabase
        .from("leader_requests")
        .update({ status, admin_note: admin_note ?? null })
        .eq("id", id);
      if (error) throw error;

      const reqObj = leaderReqs.find((r) => r.id === id);
      appendAdminActionLog({
        action: status,
        category: "Cadastro de Líder",
        item: reqObj
          ? `Novo Cadastro: ${reqObj.projeto} (${reqObj.faculdade})`
          : "Novo Cadastro de Líder",
        entityLabel: reqObj ? `${reqObj.nome_lider} (${reqObj.email})` : "Solicitante",
        justification:
          status === "rejected"
            ? (admin_note ?? "Solicitação de cadastro recusada.")
            : "Novo projeto/líder aprovado e acesso liberado.",
      });

      return status;
    },
    onSuccess: (s) => {
      toast.success(
        s === "approved"
          ? "Novo projeto/líder aprovado! O acesso já está liberado."
          : "Solicitação de cadastro recusada e justificativa enviada ao solicitante.",
      );
      qc.invalidateQueries({ queryKey: ["leader-requests"] });
      qc.invalidateQueries({ queryKey: ["entities"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["admin-action-log"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    const note = rejectReason.trim();
    if (!note) {
      toast.error("A justificativa é obrigatória para recusar uma reserva de sala ou evento.");
      return;
    }
    if (rejectTarget.kind === "workshop") {
      approveWorkshop.mutate({
        id: rejectTarget.id,
        entityId: rejectTarget.entityId,
        title: rejectTarget.title,
        status: "rejected",
        moedas_liberadas: false,
        coins: rejectTarget.coins ?? 0,
        admin_note: note,
      });
    } else if (rejectTarget.kind === "reservation") {
      decideReservation.mutate({
        id: rejectTarget.id,
        entityId: rejectTarget.entityId,
        title: rejectTarget.title,
        status: "rejected",
        admin_note: note,
      });
    } else if (rejectTarget.kind === "redemption") {
      decideRedemption.mutate({
        id: rejectTarget.id,
        entityId: rejectTarget.entityId,
        title: rejectTarget.title,
        status: "rejected",
        admin_note: note,
      });
    } else if (rejectTarget.kind === "leader") {
      decideLeader.mutate({
        id: rejectTarget.id,
        status: "rejected",
        admin_note: note,
      });
    }
    setRejectTarget(null);
    setRejectReason("");
  };

  const qNorm = queryText.trim().toLowerCase();

  // Agrupamento compacto por evento para Reuniões Liga UNI
  const groupedMeetings = useMemo(() => {
    const map = new Map<
      string,
      {
        eventId: string;
        title: string;
        dateLabel: string;
        isFuture: boolean;
        items: {
          id: string;
          entityId: string;
          entityLabel: string;
          participants: string;
          count: number;
          coins: number;
        }[];
      }
    >();

    for (const a of pendingAttendances) {
      if (selectedEventId !== "all" && a.meeting_id !== selectedEventId) continue;
      const meeting = meetings.find((m) => m.id === a.meeting_id);
      const eLabel = entityName(a.entity_id);
      const mTitle = meeting?.titulo ?? "Reunião Liga UNI";
      if (
        qNorm &&
        !eLabel.toLowerCase().includes(qNorm) &&
        !mTitle.toLowerCase().includes(qNorm) &&
        !a.representantes.toLowerCase().includes(qNorm)
      ) {
        continue;
      }
      const count = Math.max(1, countParticipants(a.representantes));
      const coins = calcMeetingCoins(count);
      const group = map.get(a.meeting_id) ?? {
        eventId: a.meeting_id,
        title: mTitle,
        dateLabel: meeting ? `${fmtDateTime(meeting.inicio)} – ${fmtDateTime(meeting.fim)}` : "",
        isFuture: meeting ? new Date(meeting.fim) >= new Date() : false,
        items: [],
      };
      group.items.push({
        id: a.id,
        entityId: a.entity_id,
        entityLabel: eLabel,
        participants: a.representantes,
        count,
        coins,
      });
      map.set(a.meeting_id, group);
    }
    return Array.from(map.values());
  }, [pendingAttendances, meetings, selectedEventId, qNorm, entities]);

  // Agrupamento compacto por evento para Capacitações UNI
  const groupedTrainings = useMemo(() => {
    const map = new Map<
      string,
      {
        eventId: string;
        title: string;
        dateLabel: string;
        isFuture: boolean;
        items: {
          id: string;
          entityId: string;
          entityLabel: string;
          participants: string;
          count: number;
          coins: number;
        }[];
      }
    >();

    for (const r of pendingTrainingRegs) {
      if (selectedEventId !== "all" && r.training_id !== selectedEventId) continue;
      const training = trainings.find((t) => t.id === r.training_id);
      const eLabel = entityName(r.entity_id);
      const tTitle = training?.titulo ?? "Capacitação UNI";
      if (
        qNorm &&
        !eLabel.toLowerCase().includes(qNorm) &&
        !tTitle.toLowerCase().includes(qNorm) &&
        !r.participantes.toLowerCase().includes(qNorm)
      ) {
        continue;
      }
      const count = Math.max(1, countParticipants(r.participantes));
      const coins = calcTrainingCoins(count);
      const group = map.get(r.training_id) ?? {
        eventId: r.training_id,
        title: tTitle,
        dateLabel: training ? `${fmtDateTime(training.inicio)} – ${fmtDateTime(training.fim)}` : "",
        isFuture: training ? new Date(training.fim) >= new Date() : false,
        items: [],
      };
      group.items.push({
        id: r.id,
        entityId: r.entity_id,
        entityLabel: eLabel,
        participants: r.participantes,
        count,
        coins,
      });
      map.set(r.training_id, group);
    }
    return Array.from(map.values());
  }, [pendingTrainingRegs, trainings, selectedEventId, qNorm, entities]);

  // Agrupamento compacto por evento para Staff em Eventos
  const groupedStaff = useMemo(() => {
    const map = new Map<
      string,
      {
        eventId: string;
        title: string;
        dateLabel: string;
        isFuture: boolean;
        items: {
          id: string;
          entityId: string;
          entityLabel: string;
          participants: string;
          observacao: string | null;
          count: number;
          coins: number;
        }[];
      }
    >();

    for (const v of pendingStaffVols) {
      if (selectedEventId !== "all" && v.call_id !== selectedEventId) continue;
      const call = staffCalls.find((c) => c.id === v.call_id);
      const eLabel = entityName(v.entity_id);
      const cTitle = call?.evento ?? "Evento Ágora";
      if (
        qNorm &&
        !eLabel.toLowerCase().includes(qNorm) &&
        !cTitle.toLowerCase().includes(qNorm) &&
        !v.participantes.toLowerCase().includes(qNorm)
      ) {
        continue;
      }
      const count = Math.max(1, countParticipants(v.participantes));
      const coins = calcStaffCoins(count);
      const group = map.get(v.call_id) ?? {
        eventId: v.call_id,
        title: cTitle,
        dateLabel: call ? `${fmtDateTime(call.inicio)} – ${fmtDateTime(call.fim)}` : "",
        isFuture: call ? new Date(call.fim) >= new Date() : false,
        items: [],
      };
      group.items.push({
        id: v.id,
        entityId: v.entity_id,
        entityLabel: eLabel,
        participants: v.participantes,
        observacao: v.observacao,
        count,
        coins,
      });
      map.set(v.call_id, group);
    }
    return Array.from(map.values());
  }, [pendingStaffVols, staffCalls, selectedEventId, qNorm, entities]);

  const filteredWorkshops = useMemo(() => {
    return pendingWorkshops.filter((w) => {
      if (!qNorm) return true;
      const eLabel = entityName(w.entity_id).toLowerCase();
      return (
        w.titulo.toLowerCase().includes(qNorm) ||
        eLabel.includes(qNorm) ||
        w.ministrantes.toLowerCase().includes(qNorm)
      );
    });
  }, [pendingWorkshops, qNorm, entities]);

  const filteredReservations = useMemo(() => {
    return pendingReservations.filter((r) => {
      if (selectedEventId !== "all" && r.room_id !== selectedEventId) return false;
      if (!qNorm) return true;
      const eLabel = entityName(r.entity_id).toLowerCase();
      const rLabel = roomName(r.room_id).toLowerCase();
      return (
        eLabel.includes(qNorm) ||
        rLabel.includes(qNorm) ||
        r.motivo.toLowerCase().includes(qNorm)
      );
    });
  }, [pendingReservations, selectedEventId, qNorm, entities, rooms]);

  const filteredRedemptions = useMemo(() => {
    return pendingRedemptions.filter((red) => {
      if (!qNorm) return true;
      const eLabel = entityName(red.entity_id).toLowerCase();
      return (
        eLabel.includes(qNorm) || red.recompensa_titulo.toLowerCase().includes(qNorm)
      );
    });
  }, [pendingRedemptions, qNorm, entities]);

  const filteredLeaders = useMemo(() => {
    return pendingLeaders.filter((req) => {
      if (!qNorm) return true;
      return (
        req.projeto.toLowerCase().includes(qNorm) ||
        req.nome_lider.toLowerCase().includes(qNorm) ||
        req.faculdade.toLowerCase().includes(qNorm)
      );
    });
  }, [pendingLeaders, qNorm]);

  const tabs: {
    key: ApprovalTabKey;
    label: string;
    icon: typeof Megaphone;
    count: number;
  }[] = [
    {
      key: "reunioes",
      label: "Reuniões",
      icon: Megaphone,
      count: pendingAttendances.length,
    },
    {
      key: "capacitacoes",
      label: "Capacitações",
      icon: GraduationCap,
      count: pendingTrainingRegs.length,
    },
    {
      key: "staff",
      label: "Staff",
      icon: HandHelping,
      count: pendingStaffVols.length,
    },
    {
      key: "oficinas",
      label: "Oficinas",
      icon: Lightbulb,
      count: pendingWorkshops.length,
    },
    {
      key: "reservas",
      label: "Reservas de Sala",
      icon: DoorOpen,
      count: pendingReservations.length,
    },
    {
      key: "beneficios-cadastros",
      label: "Benefícios & Cadastros",
      icon: Gift,
      count: pendingRedemptions.length + pendingLeaders.length,
    },
  ];

  const totalPendingCount =
    pendingAttendances.length +
    pendingTrainingRegs.length +
    pendingStaffVols.length +
    pendingWorkshops.length +
    pendingReservations.length +
    pendingRedemptions.length +
    pendingLeaders.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Central de Aprovações"
        description="Visão compacta agrupada por evento para aprovar grandes volumes de equipes e solicitações em 1 clique."
        action={
          <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold">
            <span className="text-muted-foreground">Total pendente:</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary font-bold">
              {totalPendingCount}
            </span>
          </div>
        }
      />

      {/* Barra horizontal compacta de categorias */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeSection === t.key;
          return (
            <Link
              key={t.key}
              to="/admin/aprovacoes"
              search={{ tab: t.key }}
              onClick={() => {
                setSelectedEventId("all");
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{t.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : t.count > 0
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Barra de busca rápida + filtro por evento/sala + ação em lote */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Filtrar por equipe, evento ou membro..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          {activeSection === "reunioes" && meetings.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
            >
              <option value="all">Todas as reuniões ({meetings.length})</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titulo}
                </option>
              ))}
            </select>
          )}

          {activeSection === "capacitacoes" && trainings.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
            >
              <option value="all">Todas as capacitações ({trainings.length})</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          )}

          {activeSection === "staff" && staffCalls.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
            >
              <option value="all">Todos os eventos de staff ({staffCalls.length})</option>
              {staffCalls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.evento}
                </option>
              ))}
            </select>
          )}

          {activeSection === "reservas" && rooms.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
            >
              <option value="all">Todas as salas ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          )}

          {(queryText || selectedEventId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setQueryText("");
                setSelectedEventId("all");
              }}
            >
              Limpar filtro
            </Button>
          )}
        </div>

        {/* Botão de aprovar todos os filtrados da aba */}
        {activeSection === "reunioes" && groupedMeetings.length > 0 && (
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={releaseMeetingBatch.isPending}
            onClick={() => {
              const allItems = groupedMeetings.flatMap((g) =>
                g.items.map((i) => ({ id: i.id, coins: i.coins })),
              );
              releaseMeetingBatch.mutate(allItems);
            }}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Validar todas ({groupedMeetings.reduce((acc, g) => acc + g.items.length, 0)})
          </Button>
        )}

        {activeSection === "capacitacoes" && groupedTrainings.length > 0 && (
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={releaseTrainingBatch.isPending}
            onClick={() => {
              const allItems = groupedTrainings.flatMap((g) =>
                g.items.map((i) => ({ id: i.id, coins: i.coins })),
              );
              releaseTrainingBatch.mutate(allItems);
            }}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Liberar todas ({groupedTrainings.reduce((acc, g) => acc + g.items.length, 0)})
          </Button>
        )}

        {activeSection === "staff" && groupedStaff.length > 0 && (
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={releaseStaffBatch.isPending}
            onClick={() => {
              const allItems = groupedStaff.flatMap((g) =>
                g.items.map((i) => ({ id: i.id, coins: i.coins })),
              );
              releaseStaffBatch.mutate(allItems);
            }}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Liberar todas ({groupedStaff.reduce((acc, g) => acc + g.items.length, 0)})
          </Button>
        )}

        {activeSection === "reservas" && filteredReservations.length > 1 && (
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={approveReservationsBatch.isPending}
            onClick={() =>
              approveReservationsBatch.mutate(filteredReservations.map((r) => r.id))
            }
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Aprovar todas as reservas ({filteredReservations.length})
          </Button>
        )}
      </div>

      {/* SUB-ABA 1: REUNIÕES LIGA UNI (Agrupado por Reunião) */}
      {activeSection === "reunioes" && (
        <div className="space-y-3">
          {groupedMeetings.length === 0 && (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma presença em Reunião Liga UNI pendente para o filtro selecionado.
            </Card>
          )}

          {groupedMeetings.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[`meeting-${group.eventId}`]);
            const totalGroupCoins = group.items.reduce((acc, i) => acc + i.coins, 0);

            return (
              <div
                key={group.eventId}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                {/* Cabeçalho compacto do Evento */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(`meeting-${group.eventId}`)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <Megaphone className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="truncate font-semibold text-sm text-foreground">
                      {group.title}
                    </span>
                    {group.dateLabel && (
                      <span className="hidden items-center gap-1 rounded bg-background px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
                        <Calendar className="h-3 w-3 text-primary" />
                        {group.dateLabel}
                      </span>
                    )}
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {group.items.length} equipe{group.items.length > 1 ? "s" : ""} · +
                      {totalGroupCoins} LC
                    </span>
                  </button>

                  {group.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[11px] font-semibold"
                      disabled={releaseMeetingBatch.isPending}
                      onClick={() =>
                        releaseMeetingBatch.mutate(
                          group.items.map((i) => ({ id: i.id, coins: i.coins })),
                        )
                      }
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                      Aprovar todas deste evento ({group.items.length})
                    </Button>
                  )}
                </div>

                {/* Linhas ultra-compactas por equipe */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-2 px-3.5 py-2 text-xs transition hover:bg-muted/20 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-foreground sm:w-44 sm:shrink-0 sm:truncate">
                            {item.entityLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {item.count} repr.
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate text-muted-foreground"
                            title={item.participants}
                          >
                            {item.participants}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2">
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            +{item.coins} LC
                          </span>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={releaseMeeting.isPending}
                            onClick={() =>
                              releaseMeeting.mutate({ id: item.id, coins: item.coins })
                            }
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Validar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <PastApprovalsCollapsible
            count={doneAttendances.length}
            label="Presenças em Reuniões já validadas"
          >
            {doneAttendances.map((a) => {
              const meeting = meetings.find((m) => m.id === a.meeting_id);
              const count = Math.max(1, countParticipants(a.representantes));
              const coins = calcMeetingCoins(count);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entityName(a.entity_id)}
                    </span>
                    <span>·</span>
                    <span className="font-medium">{meeting?.titulo ?? "Reunião Liga UNI"}</span>
                    <span>·</span>
                    <span className="truncate">{a.representantes}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                    <CheckCircle2 className="h-3 w-3" /> +{coins} LC
                  </span>
                </div>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 2: CAPACITAÇÕES UNI (Agrupado por Capacitação) */}
      {activeSection === "capacitacoes" && (
        <div className="space-y-3">
          {groupedTrainings.length === 0 && (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma participação em Capacitação UNI aguardando liberação de LigaCoins.
            </Card>
          )}

          {groupedTrainings.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[`training-${group.eventId}`]);
            const totalGroupCoins = group.items.reduce((acc, i) => acc + i.coins, 0);

            return (
              <div
                key={group.eventId}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(`training-${group.eventId}`)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-semibold text-sm text-foreground">
                      {group.title}
                    </span>
                    {group.dateLabel && (
                      <span className="hidden items-center gap-1 rounded bg-background px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
                        <Calendar className="h-3 w-3 text-primary" />
                        {group.dateLabel}
                      </span>
                    )}
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {group.items.length} equipe{group.items.length > 1 ? "s" : ""} · +
                      {totalGroupCoins} LC
                    </span>
                  </button>

                  {group.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[11px] font-semibold"
                      disabled={releaseTrainingBatch.isPending}
                      onClick={() =>
                        releaseTrainingBatch.mutate(
                          group.items.map((i) => ({ id: i.id, coins: i.coins })),
                        )
                      }
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                      Liberar todas deste evento ({group.items.length})
                    </Button>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-2 px-3.5 py-2 text-xs transition hover:bg-muted/20 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-foreground sm:w-44 sm:shrink-0 sm:truncate">
                            {item.entityLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {item.count} membro{item.count > 1 ? "s" : ""}
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate text-muted-foreground"
                            title={item.participants}
                          >
                            {item.participants}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2">
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            +{item.coins} LC
                          </span>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={releaseTraining.isPending}
                            onClick={() =>
                              releaseTraining.mutate({ id: item.id, coins: item.coins })
                            }
                          >
                            <Coins className="mr-1 h-3.5 w-3.5" /> Liberar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <PastApprovalsCollapsible
            count={doneTrainingRegs.length}
            label="Capacitações já validadas"
          >
            {doneTrainingRegs.map((r) => {
              const training = trainings.find((t) => t.id === r.training_id);
              const count = Math.max(1, countParticipants(r.participantes));
              const coins = calcTrainingCoins(count);
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entityName(r.entity_id)}
                    </span>
                    <span>·</span>
                    <span className="font-medium">{training?.titulo ?? "Capacitação UNI"}</span>
                    <span>·</span>
                    <span className="truncate">{r.participantes}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                    <CheckCircle2 className="h-3 w-3" /> +{coins} LC
                  </span>
                </div>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 3: STAFF EM EVENTOS (Agrupado por Evento) */}
      {activeSection === "staff" && (
        <div className="space-y-3">
          {groupedStaff.length === 0 && (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhum auxílio de Staff aguardando liberação de LigaCoins no momento.
            </Card>
          )}

          {groupedStaff.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[`staff-${group.eventId}`]);
            const totalGroupCoins = group.items.reduce((acc, i) => acc + i.coins, 0);

            return (
              <div
                key={group.eventId}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(`staff-${group.eventId}`)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <HandHelping className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate font-semibold text-sm text-foreground">
                      {group.title}
                    </span>
                    {group.dateLabel && (
                      <span className="hidden items-center gap-1 rounded bg-background px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
                        <Calendar className="h-3 w-3 text-primary" />
                        {group.dateLabel}
                      </span>
                    )}
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {group.items.length} equipe{group.items.length > 1 ? "s" : ""} · +
                      {totalGroupCoins} LC
                    </span>
                  </button>

                  {group.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[11px] font-semibold"
                      disabled={releaseStaffBatch.isPending}
                      onClick={() =>
                        releaseStaffBatch.mutate(
                          group.items.map((i) => ({ id: i.id, coins: i.coins })),
                        )
                      }
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                      Liberar todas deste evento ({group.items.length})
                    </Button>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-2 px-3.5 py-2 text-xs transition hover:bg-muted/20 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-foreground sm:w-44 sm:shrink-0 sm:truncate">
                            {item.entityLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {item.count} vol.
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate text-muted-foreground"
                            title={item.participants}
                          >
                            {item.participants}
                            {item.observacao ? ` · Obs: ${item.observacao}` : ""}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2">
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            +{item.coins} LC
                          </span>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={releaseStaff.isPending}
                            onClick={() =>
                              releaseStaff.mutate({ id: item.id, coins: item.coins })
                            }
                          >
                            <Coins className="mr-1 h-3.5 w-3.5" /> Liberar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <PastApprovalsCollapsible
            count={doneStaffVols.length}
            label="Auxílios de Staff já validados"
          >
            {doneStaffVols.map((v) => {
              const call = staffCalls.find((c) => c.id === v.call_id);
              const count = Math.max(1, countParticipants(v.participantes));
              const coins = calcStaffCoins(count);
              return (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entityName(v.entity_id)}
                    </span>
                    <span>·</span>
                    <span className="font-medium">{call?.evento ?? "Evento Ágora"}</span>
                    <span>·</span>
                    <span className="truncate">{v.participantes}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                    <CheckCircle2 className="h-3 w-3" /> +{coins} LC
                  </span>
                </div>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 4: OFICINAS DE EQUIPES (Tabela/Linhas compactas) */}
      {activeSection === "oficinas" && (
        <div className="space-y-3">
          {filteredWorkshops.length === 0 ? (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma oficina entre equipes pendente de aprovação ou liberação de moedas.
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border/60">
              {filteredWorkshops.map((w) => {
                const count = Math.max(1, countParticipants(w.ministrantes));
                const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
                const coins = calcWorkshopCoins(count, isJoint);

                return (
                  <div
                    key={w.id}
                    className="flex flex-col justify-between gap-2.5 px-3.5 py-2.5 text-xs transition hover:bg-muted/20 lg:flex-row lg:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-success" />
                        <span className="font-semibold text-sm text-foreground">{w.titulo}</span>
                        <StatusBadge status={w.status} />
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          +{coins} LC
                        </span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          {entityName(w.entity_id)}
                        </span>
                        {isJoint && w.partner_entity_id && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            <Handshake className="h-3 w-3" /> + {entityName(w.partner_entity_id)} (+
                            {CREDITS_PER_JOINT_WORKSHOP_BONUS} LC)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="h-3 w-3 text-primary" />
                          {fmtDateTime(w.data_sugerida)}
                          {w.fim ? ` – ${fmtDateTime(w.fim)}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {roomName(w.room_id)}
                        </span>
                        <span className="truncate" title={w.ministrantes}>
                          <b>{count} min.:</b> {w.ministrantes}
                        </span>
                        {w.descricao && (
                          <span className="truncate text-muted-foreground/80" title={w.descricao}>
                            — {w.descricao}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {w.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            onClick={() =>
                              approveWorkshop.mutate({
                                id: w.id,
                                status: "approved",
                                moedas_liberadas: false,
                                coins,
                              })
                            }
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Publicar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => {
                              setRejectReason("");
                              setRejectTarget({
                                kind: "workshop",
                                id: w.id,
                                entityId: w.entity_id,
                                title: `Oficina: ${w.titulo}`,
                                entityLabel: entityName(w.entity_id),
                                coins,
                              });
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Recusar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() =>
                          approveWorkshop.mutate({
                            id: w.id,
                            status: "approved",
                            moedas_liberadas: true,
                            coins,
                          })
                        }
                      >
                        <Coins className="mr-1 h-3.5 w-3.5" /> +{coins} LC
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <PastApprovalsCollapsible
            count={doneWorkshops.length}
            label="Oficinas já concluídas ou avaliadas"
          >
            {doneWorkshops.map((w) => {
              const count = Math.max(1, countParticipants(w.ministrantes));
              const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
              const coins = calcWorkshopCoins(count, isJoint);
              return (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{w.titulo}</span>
                      <StatusBadge status={w.status} />
                      <span>· {entityName(w.entity_id)}</span>
                      <span>· {fmtDateTime(w.data_sugerida)}</span>
                    </div>
                    {w.admin_note && (
                      <div className="text-[11px] italic text-destructive">
                        Justificativa enviada: {w.admin_note}
                      </div>
                    )}
                  </div>
                  {w.moedas_liberadas && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                      <CheckCircle2 className="h-3 w-3" /> +{coins} LC
                    </span>
                  )}
                </div>
              );
            })}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 5: RESERVAS DE SALA (Linhas compactas estilo tabela) */}
      {activeSection === "reservas" && (
        <div className="space-y-3">
          {filteredReservations.length === 0 ? (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma reserva de sala pendente de análise no momento.
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border/60">
              {filteredReservations.map((r) => {
                const isOficina = r.purpose === "capacitacao_geral";
                return (
                  <div
                    key={r.id}
                    className="flex flex-col justify-between gap-2 px-3.5 py-2.5 text-xs transition hover:bg-muted/20 lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground sm:w-44 sm:shrink-0 sm:truncate">
                        <DoorOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {roomName(r.room_id)}
                      </span>

                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {entityName(r.entity_id)}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <Calendar className="h-3 w-3 text-primary" />
                        {fmtDateTime(r.inicio)} – {fmtDateTime(r.fim)}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isOficina
                            ? "bg-success/15 text-success"
                            : "bg-amber-500/15 text-amber-700"
                        }`}
                      >
                        {isOficina ? "Oficina (Grátis)" : `Reunião (${CREDITS_COST_ROOM} LC)`}
                      </span>

                      <span
                        className="min-w-0 flex-1 truncate text-muted-foreground"
                        title={r.motivo}
                      >
                        {r.motivo}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => decideReservation.mutate({ id: r.id, status: "approved" })}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => {
                          setRejectReason("");
                          setRejectTarget({
                            kind: "reservation",
                            id: r.id,
                            entityId: r.entity_id,
                            title: `Reserva de Sala: ${roomName(r.room_id)} (${fmtDateTime(r.inicio)})`,
                            entityLabel: entityName(r.entity_id),
                          });
                        }}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Recusar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <PastApprovalsCollapsible
            count={doneReservations.length}
            label="Reservas de Sala já avaliadas"
          >
            {doneReservations.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{roomName(r.room_id)}</span>
                    <StatusBadge status={r.status} />
                    <span>· {entityName(r.entity_id)}</span>
                    <span>
                      · {fmtDateTime(r.inicio)} – {fmtDateTime(r.fim)}
                    </span>
                    <span className="truncate">· {r.motivo}</span>
                  </div>
                  {r.admin_note && (
                    <div className="text-[11px] italic text-destructive">
                      Justificativa enviada: {r.admin_note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* SUB-ABA 6: BENEFÍCIOS & CADASTROS (Linhas compactas) */}
      {activeSection === "beneficios-cadastros" && (
        <div className="space-y-3">
          {filteredRedemptions.length === 0 && filteredLeaders.length === 0 ? (
            <Card className="py-6 text-center text-xs text-muted-foreground">
              Nenhum resgate de benefício ou cadastro de novo líder pendente no momento.
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border/60">
              {filteredRedemptions.map((red) => (
                <div
                  key={red.id}
                  className="flex flex-col justify-between gap-2 px-3.5 py-2.5 text-xs transition hover:bg-muted/20 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <Gift className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="font-semibold text-foreground">{red.recompensa_titulo}</span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      -{red.custo} LC
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {entityName(red.entity_id)}
                    </span>
                    {red.observacao && (
                      <span className="truncate text-muted-foreground" title={red.observacao}>
                        Obs: {red.observacao}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => decideRedemption.mutate({ id: red.id, status: "approved" })}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setRejectReason("");
                        setRejectTarget({
                          kind: "redemption",
                          id: red.id,
                          entityId: red.entity_id,
                          title: `Resgate de Benefício: ${red.recompensa_titulo}`,
                          entityLabel: entityName(red.entity_id),
                        });
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Recusar
                    </Button>
                  </div>
                </div>
              ))}

              {filteredLeaders.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between gap-2 px-3.5 py-2.5 text-xs transition hover:bg-muted/20 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      Novo Cadastro
                    </span>
                    <span className="font-semibold text-foreground">
                      {req.projeto} ({req.faculdade})
                    </span>
                    <span className="text-muted-foreground">
                      Líder: <b className="text-foreground">{req.nome_lider}</b> ({req.email})
                    </span>
                    {req.descricao && (
                      <span className="truncate text-muted-foreground" title={req.descricao}>
                        — {req.descricao}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => decideLeader.mutate({ id: req.id, status: "approved" })}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setRejectReason("");
                        setRejectTarget({
                          kind: "leader",
                          id: req.id,
                          title: `Novo Cadastro: ${req.projeto} (${req.faculdade})`,
                          entityLabel: `${req.nome_lider} (${req.email})`,
                        });
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <PastApprovalsCollapsible
            count={doneRedemptions.length + doneLeaders.length}
            label="Benefícios e Cadastros já avaliados"
          >
            {doneRedemptions.map((red) => (
              <div
                key={red.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{red.recompensa_titulo}</span>
                    <StatusBadge status={red.status} />
                    <span>· {entityName(red.entity_id)}</span>
                    <span>· -{red.custo} LC</span>
                  </div>
                  {red.admin_note && (
                    <div className="text-[11px] italic text-destructive">
                      Justificativa enviada: {red.admin_note}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {doneLeaders.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {req.projeto} ({req.faculdade})
                    </span>
                    <StatusBadge status={req.status} />
                    <span>
                      · {req.nome_lider} ({req.email})
                    </span>
                  </div>
                  {req.admin_note && (
                    <div className="text-[11px] italic text-destructive">
                      Justificativa enviada: {req.admin_note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </PastApprovalsCollapsible>
        </div>
      )}

      {/* Componente de Log de Ações do Administrador (Aprovações e Recusas) */}
      <AdminActionLog />

      {/* Modal de justificativa obrigatória ao recusar evento, oficina ou reserva de sala */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justificativa obrigatória da recusa</DialogTitle>
          </DialogHeader>
          {rejectTarget && (
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">Solicitação recusada:</span>{" "}
                  <strong className="text-foreground">{rejectTarget.title}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Equipe responsável:</span>{" "}
                  <strong className="text-foreground">{rejectTarget.entityLabel}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Justificativa para enviar à equipe <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Descreva obrigatoriamente o motivo da recusa (ex.: conflito de horário na sala, necessidade de reagendamento, ajuste de escopo do evento...)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Preenchimento obrigatório. Esta justificativa será enviada automaticamente para a
                  equipe responsável (no painel da equipe, na solicitação e na aba Chamados).
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!rejectReason.trim()}
                >
                  Confirmar recusa e enviar para a equipe
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
