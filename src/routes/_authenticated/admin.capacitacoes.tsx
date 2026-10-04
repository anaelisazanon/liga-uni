import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HandHelping,
  History,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CoinPerPersonTag, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtDateTime } from "@/lib/auth";
import {
  CREDITS_PER_MEETING_EVENT,
  entitiesQuery,
  type GeneralMeeting,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  portalConfigQuery,
  roomsQuery,
  type StaffCall,
  staffCallsQuery,
  staffVolunteersQuery,
  type Training,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/capacitacoes")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Eventos & Capacitações — Admin Liga UNI" }] }),
  component: AdminCapacitacoesPage,
});

const emptyTrainingForm = {
  titulo: "",
  descricao: "",
  ministrante: "",
  local: "Auditório Ágora Tech Park",
  data: "",
  horaInicio: "",
  horaFim: "",
  vagas: "30",
  obrigatoria: false,
  ativa: true,
};

const emptyStaffForm = {
  evento: "",
  descricao: "",
  local: "Auditório Ágora Tech Park",
  data: "",
  horaInicio: "",
  horaFim: "",
  vagas: "15",
  ativa: true,
};

const emptyMeetingForm = {
  titulo: "",
  pauta: "",
  local: "Auditório Ágora Tech Park",
  data: "",
  horaInicio: "",
  horaFim: "",
  creditos_recompensa: CREDITS_PER_MEETING_EVENT,
  ativa: true,
};

function toLocalDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminCapacitacoesPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const { data: trainings = [], isLoading } = useQuery(trainingsQuery);
  const { data: registrations = [] } = useQuery(trainingRegistrationsQuery());
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: portalConfig } = useQuery(portalConfigQuery);

  const initialTab =
    search.tab === "staff" || search.tab === "reunioes" ? search.tab : "capacitacoes";
  const [section, setSection] = useState<"capacitacoes" | "staff" | "reunioes">(initialTab);

  // Sincroniza quando o usuário navega pelos atalhos com ?tab=
  const activeSection: "capacitacoes" | "staff" | "reunioes" =
    search.tab === "staff" || search.tab === "reunioes" || search.tab === "capacitacoes"
      ? search.tab
      : section;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [form, setForm] = useState(emptyTrainingForm);
  const [showPast, setShowPast] = useState(false);

  const [openStaff, setOpenStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffCall | null>(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [showPastStaff, setShowPastStaff] = useState(false);

  const [openMeeting, setOpenMeeting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<GeneralMeeting | null>(null);
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm);
  const [showPastMeetings, setShowPastMeetings] = useState(false);

  const defaultRoomName = rooms[0]?.nome ?? "Auditório Ágora Tech Park";

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyTrainingForm, local: defaultRoomName });
    setOpen(true);
  };

  const openEdit = (t: Training) => {
    setEditing(t);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      ministrante: t.ministrante ?? "",
      local: t.local ?? defaultRoomName,
      data: toLocalDate(t.inicio),
      horaInicio: toLocalTime(t.inicio),
      horaFim: toLocalTime(t.fim),
      vagas: t.vagas ? String(t.vagas) : "",
      obrigatoria: Boolean(t.obrigatoria),
      ativa: t.ativa,
    });
    setOpen(true);
  };

  const openNewStaff = () => {
    setEditingStaff(null);
    setStaffForm({ ...emptyStaffForm, local: defaultRoomName });
    setOpenStaff(true);
  };

  const openEditStaff = (c: StaffCall) => {
    setEditingStaff(c);
    setStaffForm({
      evento: c.evento ?? "",
      descricao: c.descricao ?? "",
      local: c.local ?? defaultRoomName,
      data: toLocalDate(c.inicio),
      horaInicio: toLocalTime(c.inicio),
      horaFim: toLocalTime(c.fim),
      vagas: c.vagas ? String(c.vagas) : "",
      ativa: c.ativa,
    });
    setOpenStaff(true);
  };

  const openNewMeeting = () => {
    setEditingMeeting(null);
    setMeetingForm({
      ...emptyMeetingForm,
      local: defaultRoomName,
      creditos_recompensa: portalConfig?.meetingEventCoins ?? CREDITS_PER_MEETING_EVENT,
    });
    setOpenMeeting(true);
  };

  const openEditMeeting = (m: GeneralMeeting) => {
    setEditingMeeting(m);
    setMeetingForm({
      titulo: m.titulo,
      pauta: m.pauta ?? "",
      local: m.local ?? defaultRoomName,
      data: toLocalDate(m.inicio),
      horaInicio: toLocalTime(m.inicio),
      horaFim: toLocalTime(m.fim),
      creditos_recompensa:
        m.creditos_recompensa ?? portalConfig?.meetingEventCoins ?? CREDITS_PER_MEETING_EVENT,
      ativa: m.ativa,
    });
    setOpenMeeting(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.data || !form.horaInicio || !form.horaFim) {
        throw new Error("Informe o dia, horário de início e horário de término.");
      }
      if (form.horaFim <= form.horaInicio) {
        throw new Error(
          "O horário de término precisa ser posterior ao horário de início no mesmo dia.",
        );
      }
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || "",
        ministrante: form.ministrante.trim() || "Coordenação Liga Ágora",
        local: form.local.trim() || defaultRoomName,
        inicio: new Date(`${form.data}T${form.horaInicio}`).toISOString(),
        fim: new Date(`${form.data}T${form.horaFim}`).toISOString(),
        vagas: form.vagas ? Number(form.vagas) : 30,
        obrigatoria: form.obrigatoria,
        ativa: form.ativa,
      };
      if (editing) {
        const { error } = await supabase.from("trainings").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trainings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainings"] });
      const notifiedCount = entities.filter((e) => e.avisos_email !== false).length;
      toast.success(
        editing
          ? "Capacitação atualizada!"
          : `Capacitação criada! Aviso enviado por e-mail para ${notifiedCount} líder(es) com notificações ativas.`,
      );
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveStaff = useMutation({
    mutationFn: async () => {
      if (!staffForm.data || !staffForm.horaInicio || !staffForm.horaFim) {
        throw new Error("Informe o dia, horário de início e horário de término.");
      }
      if (staffForm.horaFim <= staffForm.horaInicio) {
        throw new Error(
          "O horário de término precisa ser posterior ao horário de início no mesmo dia.",
        );
      }
      const payload = {
        evento: staffForm.evento.trim(),
        descricao: staffForm.descricao.trim() || "",
        local: staffForm.local.trim() || defaultRoomName,
        inicio: new Date(`${staffForm.data}T${staffForm.horaInicio}`).toISOString(),
        fim: new Date(`${staffForm.data}T${staffForm.horaFim}`).toISOString(),
        vagas: staffForm.vagas ? Number(staffForm.vagas) : 15,
        ativa: staffForm.ativa,
      };
      if (editingStaff) {
        const { error } = await supabase
          .from("staff_calls")
          .update(payload)
          .eq("id", editingStaff.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_calls").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-calls"] });
      toast.success(
        editingStaff ? "Chamado de staff atualizado!" : "Novo chamado de staff publicado!",
      );
      setOpenStaff(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMeeting = useMutation({
    mutationFn: async () => {
      if (!meetingForm.data || !meetingForm.horaInicio || !meetingForm.horaFim) {
        throw new Error("Informe o dia, horário de início e horário de término.");
      }
      if (meetingForm.horaFim <= meetingForm.horaInicio) {
        throw new Error(
          "O horário de término precisa ser posterior ao horário de início no mesmo dia.",
        );
      }
      const payload = {
        titulo: meetingForm.titulo.trim(),
        pauta: meetingForm.pauta.trim() || "",
        local: meetingForm.local.trim() || defaultRoomName,
        inicio: new Date(`${meetingForm.data}T${meetingForm.horaInicio}`).toISOString(),
        fim: new Date(`${meetingForm.data}T${meetingForm.horaFim}`).toISOString(),
        pontos: Number(meetingForm.creditos_recompensa) || CREDITS_PER_MEETING_EVENT,
        creditos_recompensa: Number(meetingForm.creditos_recompensa) || CREDITS_PER_MEETING_EVENT,
        obrigatoria: true,
        ativa: meetingForm.ativa,
      };
      if (editingMeeting) {
        const { error } = await supabase
          .from("general_meetings")
          .update(payload)
          .eq("id", editingMeeting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("general_meetings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-meetings"] });
      const notifiedCount = entities.filter((e) => e.avisos_email !== false).length;
      toast.success(
        editingMeeting
          ? "Reunião Liga UNI atualizada!"
          : `Reunião Liga UNI convocada! Aviso enviado por e-mail para ${notifiedCount} líder(es).`,
      );
      setOpenMeeting(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trainings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Capacitação removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_calls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-calls"] });
      toast.success("Chamado de staff removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("general_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-meetings"] });
      toast.success("Reunião Liga UNI removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();
  const upcomingTrainings = [...trainings]
    .filter((t) => new Date(t.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const pastTrainings = [...trainings]
    .filter((t) => new Date(t.fim) < now)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const upcomingStaff = [...staffCalls]
    .filter((c) => new Date(c.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const pastStaff = [...staffCalls]
    .filter((c) => new Date(c.fim) < now)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const upcomingMeetings = [...meetings]
    .filter((m) => new Date(m.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const pastMeetings = [...meetings]
    .filter((m) => new Date(m.fim) < now)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const trainingMemberLc = portalConfig?.trainingMemberCoins ?? 5;
  const trainingEventLc = portalConfig?.trainingEventCoins ?? 10;
  const staffMemberLc = portalConfig?.staffMemberCoins ?? 30;
  const staffEventLc = portalConfig?.staffEventCoins ?? 40;
  const meetingMemberLc = portalConfig?.meetingMemberCoins ?? 25;
  const meetingEventLc = portalConfig?.meetingEventCoins ?? 50;

  const renderTrainingCard = (t: Training, isPast: boolean) => {
    const regs = registrations.filter((r) => r.training_id === t.id);
    const pendingCoins = regs.filter((r) => !r.moedas_liberadas).length;

    return (
      <div
        key={t.id}
        className={
          isPast
            ? "rounded-xl border border-border bg-muted/40 p-5 text-muted-foreground flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            : "rounded-xl border border-border bg-card p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        }
      >
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <GraduationCap className="size-3.5" /> Capacitação UNI
            </span>
            <CoinPerPersonTag
              perMember={trainingMemberLc}
              perEvent={trainingEventLc}
              className="text-xs text-amber-800"
            />
            {t.obrigatoria && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
                Obrigatória
              </span>
            )}
            {isPast && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                Encerrada
              </span>
            )}
            {!t.ativa && <span className="text-xs text-muted-foreground">(Inativa)</span>}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{t.titulo}</h3>
          {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-accent" />
              {fmtDateTime(t.inicio)} → {fmtDateTime(t.fim)}
            </div>
            {t.ministrante && (
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-accent" /> {t.ministrante}
              </div>
            )}
            {t.local && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-accent" /> {t.local}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-accent" /> {regs.length} equipe(s) inscrita(s)
              {t.vagas ? ` · máx. ${t.vagas} vagas` : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          {pendingCoins > 0 && (
            <Button size="sm" variant="default" asChild>
              <Link to="/admin/aprovacoes" search={{ tab: "capacitacoes" }}>
                Liberar LC ({pendingCoins}) <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => remove.mutate(t.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStaffCard = (c: StaffCall, isPast: boolean) => {
    const vols = staffVols.filter((v) => v.call_id === c.id);
    const pendingCoins = vols.filter((v) => !v.moedas_liberadas).length;

    return (
      <div
        key={c.id}
        className={
          isPast
            ? "rounded-xl border border-border bg-muted/40 p-5 text-muted-foreground flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            : "rounded-xl border border-border bg-card p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        }
      >
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <HandHelping className="size-3.5" /> Staff em Evento do Ágora
            </span>
            <CoinPerPersonTag
              perMember={staffMemberLc}
              perEvent={staffEventLc}
              className="text-xs text-amber-800"
            />
            {isPast && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                Encerrado
              </span>
            )}
            {!c.ativa && <span className="text-xs text-muted-foreground">(Inativo)</span>}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{c.evento}</h3>
          {c.descricao && <p className="text-sm text-muted-foreground">{c.descricao}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-accent" />
              {fmtDateTime(c.inicio)} → {fmtDateTime(c.fim)}
            </div>
            {c.local && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-accent" /> {c.local}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-accent" /> {vols.length} equipe(s) voluntária(s)
              {c.vagas ? ` · ${c.vagas} vagas` : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          {pendingCoins > 0 && (
            <Button size="sm" variant="default" asChild>
              <Link to="/admin/aprovacoes" search={{ tab: "staff" }}>
                Liberar LC ({pendingCoins}) <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openEditStaff(c)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => removeStaff.mutate(c.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderMeetingCard = (m: GeneralMeeting, isPast: boolean) => {
    const meetingAtt = attendances.filter((a) => a.meeting_id === m.id && a.presente);
    const pendingCoins = meetingAtt.filter((a) => !a.moedas_liberadas).length;
    const baseBonus = m.creditos_recompensa ?? meetingEventLc;

    return (
      <div
        key={m.id}
        className={
          isPast
            ? "rounded-xl border border-border bg-muted/40 p-5 text-muted-foreground flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            : "rounded-xl border border-border bg-card p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        }
      >
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Megaphone className="size-3.5" /> Reunião Geral Liga UNI
            </span>
            <CoinPerPersonTag
              perMember={meetingMemberLc}
              perEvent={baseBonus}
              className="text-xs text-amber-800"
            />
            {isPast && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                Realizada
              </span>
            )}
            {!m.ativa && <span className="text-xs text-muted-foreground">(Inativa)</span>}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{m.titulo}</h3>
          {m.pauta && <p className="text-sm text-muted-foreground">{m.pauta}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-accent" />
              {fmtDateTime(m.inicio)} → {fmtDateTime(m.fim)}
            </div>
            {m.local && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-accent" /> {m.local}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-accent" /> {meetingAtt.length} equipe(s) com presença
              registrada
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          {pendingCoins > 0 && (
            <Button size="sm" variant="default" asChild>
              <Link to="/admin/aprovacoes" search={{ tab: "reunioes" }}>
                Liberar LC ({pendingCoins}) <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openEditMeeting(m)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => removeMeeting.mutate(m.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos & Capacitações Oficiais"
        description="Adicione e edite Capacitações UNI, Chamados de Staff em Eventos do Ágora e Reuniões Gerais da Liga UNI."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="hero" onClick={openNew}>
              <Plus className="size-4" /> Nova Capacitação
            </Button>
            <Button variant="outline" onClick={openNewStaff}>
              <Plus className="size-4" /> Novo Evento de Staff
            </Button>
            <Button variant="outline" onClick={openNewMeeting}>
              <Plus className="size-4" /> Nova Reunião Liga UNI
            </Button>
          </div>
        }
      />

      {/* Seletor entre Capacitações UNI, Chamados de Staff e Reuniões Liga UNI */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setSection("capacitacoes")}
          className={
            activeSection === "capacitacoes"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <GraduationCap className="size-4" />
          Capacitações UNI ({trainings.length})
        </button>
        <button
          type="button"
          onClick={() => setSection("staff")}
          className={
            activeSection === "staff"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <HandHelping className="size-4" />
          Chamados de Staff em Eventos ({staffCalls.length})
        </button>
        <button
          type="button"
          onClick={() => setSection("reunioes")}
          className={
            activeSection === "reunioes"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <Megaphone className="size-4" />
          Reuniões Gerais Liga UNI ({meetings.length})
        </button>
      </div>

      {activeSection === "capacitacoes" ? (
        isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <GraduationCap className="size-8 text-muted-foreground mx-auto" />
            <div className="font-display font-semibold">Nenhuma capacitação cadastrada</div>
            <p className="text-sm text-muted-foreground">
              Crie sessões de capacitação para as entidades da Liga UNI.
            </p>
            <Button variant="default" onClick={openNew}>
              <Plus className="size-4" /> Criar capacitação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingTrainings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                Nenhuma capacitação futura agendada no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrainings.map((t) => renderTrainingCard(t, false))}
              </div>
            )}

            {pastTrainings.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPast((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 hover:bg-muted px-4 py-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                    <History className="size-4" />
                    <span>Capacitações já realizadas ({pastTrainings.length})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <span>{showPast ? "Ocultar" : "Mostrar"}</span>
                    {showPast ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {showPast && (
                  <div className="mt-3 space-y-3">
                    {pastTrainings.map((t) => renderTrainingCard(t, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      ) : activeSection === "staff" ? (
        staffCalls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <HandHelping className="size-8 text-muted-foreground mx-auto" />
            <div className="font-display font-semibold">Nenhum chamado de Staff publicado</div>
            <p className="text-sm text-muted-foreground">
              Publique oportunidades para que os membros das entidades atuem como Staff nos eventos
              do Ágora Tech Park.
            </p>
            <Button variant="default" onClick={openNewStaff}>
              <Plus className="size-4" /> Novo chamado de Staff
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingStaff.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                Nenhum chamado de staff futuro aberto no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingStaff.map((c) => renderStaffCard(c, false))}
              </div>
            )}

            {pastStaff.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPastStaff((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 hover:bg-muted px-4 py-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                    <History className="size-4" />
                    <span>Chamados de Staff encerrados ({pastStaff.length})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <span>{showPastStaff ? "Ocultar" : "Mostrar"}</span>
                    {showPastStaff ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {showPastStaff && (
                  <div className="mt-3 space-y-3">
                    {pastStaff.map((c) => renderStaffCard(c, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
          <Megaphone className="size-8 text-muted-foreground mx-auto" />
          <div className="font-display font-semibold">Nenhuma Reunião Liga UNI cadastrada</div>
          <p className="text-sm text-muted-foreground">
            Convoque reuniões gerais com os líderes de todas as entidades do Liga UNI.
          </p>
          <Button variant="default" onClick={openNewMeeting}>
            <Plus className="size-4" /> Nova Reunião Liga UNI
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Nenhuma reunião geral futura agendada no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => renderMeetingCard(m, false))}
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPastMeetings((v) => !v)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 hover:bg-muted px-4 py-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                  <History className="size-4" />
                  <span>Reuniões Liga UNI já realizadas ({pastMeetings.length})</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <span>{showPastMeetings ? "Ocultar" : "Mostrar"}</span>
                  {showPastMeetings ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>

              {showPastMeetings && (
                <div className="mt-3 space-y-3">
                  {pastMeetings.map((m) => renderMeetingCard(m, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Capacitação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar capacitação" : "Nova capacitação UNI"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Título da capacitação</Label>
              <Input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Workshop de Gestão Ágil e Captação de Recursos"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ministrante</Label>
                <Input
                  value={form.ministrante}
                  onChange={(e) => setForm({ ...form, ministrante: e.target.value })}
                  placeholder="Ex.: Mentores Liga Ágora"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sala / Espaço do Ágora</Label>
                <select
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.nome}>
                      {room.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Dia da capacitação</Label>
                <Input
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Horário de início</Label>
                  <Input
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário de término</Label>
                  <Input
                    type="time"
                    required
                    value={form.horaFim}
                    onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vagas (opcional)</Label>
              <Input
                type="number"
                min={1}
                value={form.vagas}
                onChange={(e) => setForm({ ...form, vagas: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Presença obrigatória</div>
                <div className="text-xs text-muted-foreground">
                  Destaca a capacitação como obrigatória
                </div>
              </div>
              <Switch
                checked={form.obrigatoria}
                onCheckedChange={(v) => setForm({ ...form, obrigatoria: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Ativa (visível aos líderes)</div>
              </div>
              <Switch
                checked={form.ativa}
                onCheckedChange={(v) => setForm({ ...form, ativa: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Chamado de Staff */}
      <Dialog open={openStaff} onOpenChange={setOpenStaff}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Editar chamado de Staff" : "Novo chamado de Staff em Evento"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveStaff.mutate();
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Nome do evento</Label>
              <Input
                required
                value={staffForm.evento}
                onChange={(e) => setStaffForm({ ...staffForm, evento: e.target.value })}
                placeholder="Ex.: Hackathon Liga UNI & Mostra Tecnológica no Ágora"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição das atribuições</Label>
              <Textarea
                rows={3}
                value={staffForm.descricao}
                onChange={(e) => setStaffForm({ ...staffForm, descricao: e.target.value })}
                placeholder="Ex.: Recepção de palestrantes, credenciamento e apoio de palco."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sala / Espaço do Ágora</Label>
                <select
                  value={staffForm.local}
                  onChange={(e) => setStaffForm({ ...staffForm, local: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.nome}>
                      {room.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vagas de Staff</Label>
                <Input
                  type="number"
                  min={1}
                  value={staffForm.vagas}
                  onChange={(e) => setStaffForm({ ...staffForm, vagas: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Dia do evento</Label>
                <Input
                  type="date"
                  required
                  value={staffForm.data}
                  onChange={(e) => setStaffForm({ ...staffForm, data: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Horário de início</Label>
                  <Input
                    type="time"
                    required
                    value={staffForm.horaInicio}
                    onChange={(e) => setStaffForm({ ...staffForm, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário de término</Label>
                  <Input
                    type="time"
                    required
                    value={staffForm.horaFim}
                    onChange={(e) => setStaffForm({ ...staffForm, horaFim: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Chamado ativo (visível aos líderes)</div>
              </div>
              <Switch
                checked={staffForm.ativa}
                onCheckedChange={(v) => setStaffForm({ ...staffForm, ativa: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenStaff(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveStaff.isPending}>
                {saveStaff.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Reunião Geral Liga UNI */}
      <Dialog open={openMeeting} onOpenChange={setOpenMeeting}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMeeting ? "Editar Reunião Liga UNI" : "Convocar Reunião Geral Liga UNI"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMeeting.mutate();
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Título da reunião</Label>
              <Input
                required
                value={meetingForm.titulo}
                onChange={(e) => setMeetingForm({ ...meetingForm, titulo: e.target.value })}
                placeholder="Ex.: Reunião Geral de Alinhamento Liga UNI"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pauta / Descrição</Label>
              <Textarea
                rows={3}
                value={meetingForm.pauta}
                onChange={(e) => setMeetingForm({ ...meetingForm, pauta: e.target.value })}
                placeholder="Principais temas e alinhamentos da reunião..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sala / Espaço do Ágora</Label>
                <select
                  value={meetingForm.local}
                  onChange={(e) => setMeetingForm({ ...meetingForm, local: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.nome}>
                      {room.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Bônus fixo da reunião (LC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={meetingForm.creditos_recompensa}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      creditos_recompensa: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Dia da reunião</Label>
                <Input
                  type="date"
                  required
                  value={meetingForm.data}
                  onChange={(e) => setMeetingForm({ ...meetingForm, data: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Horário de início</Label>
                  <Input
                    type="time"
                    required
                    value={meetingForm.horaInicio}
                    onChange={(e) => setMeetingForm({ ...meetingForm, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário de término</Label>
                  <Input
                    type="time"
                    required
                    value={meetingForm.horaFim}
                    onChange={(e) => setMeetingForm({ ...meetingForm, horaFim: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Reunião ativa (visível aos líderes)</div>
              </div>
              <Switch
                checked={meetingForm.ativa}
                onCheckedChange={(v) => setMeetingForm({ ...meetingForm, ativa: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenMeeting(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMeeting.isPending}>
                {saveMeeting.isPending ? "Salvando..." : "Salvar reunião"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
