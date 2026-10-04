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
  CREDITS_PER_STAFF_EVENT,
  CREDITS_PER_STAFF_MEMBER,
  CREDITS_PER_TRAINING_EVENT,
  CREDITS_PER_TRAINING_MEMBER,
  entitiesQuery,
  roomsQuery,
  type StaffCall,
  staffCallsQuery,
  staffVolunteersQuery,
  type Training,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/capacitacoes")({
  head: () => ({ meta: [{ title: "Capacitações & Staff — Admin Liga UNI" }] }),
  component: AdminCapacitacoesPage,
});

const emptyTrainingForm = {
  titulo: "",
  descricao: "",
  ministrante: "",
  local: "Auditório Principal Ágora",
  inicio: "",
  fim: "",
  vagas: "",
  obrigatoria: false,
  ativa: true,
};

const emptyStaffForm = {
  titulo: "",
  descricao: "",
  local: "Auditório Principal Ágora",
  inicio: "",
  fim: "",
  vagas: "10",
  ativa: true,
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminCapacitacoesPage() {
  const qc = useQueryClient();
  const { data: trainings = [], isLoading } = useQuery(trainingsQuery);
  const { data: registrations = [] } = useQuery(trainingRegistrationsQuery());
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);

  const [section, setSection] = useState<"capacitacoes" | "staff">("capacitacoes");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [form, setForm] = useState(emptyTrainingForm);
  const [showPast, setShowPast] = useState(false);

  const [openStaff, setOpenStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffCall | null>(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [showPastStaff, setShowPastStaff] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyTrainingForm);
    setOpen(true);
  };

  const openEdit = (t: Training) => {
    setEditing(t);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      ministrante: t.ministrante ?? "",
      local: t.local ?? "Auditório Principal Ágora",
      inicio: toLocalInput(t.inicio),
      fim: toLocalInput(t.fim),
      vagas: t.vagas ? String(t.vagas) : "",
      obrigatoria: t.obrigatoria,
      ativa: t.ativa,
    });
    setOpen(true);
  };

  const openNewStaff = () => {
    setEditingStaff(null);
    setStaffForm(emptyStaffForm);
    setOpenStaff(true);
  };

  const openEditStaff = (c: StaffCall) => {
    setEditingStaff(c);
    setStaffForm({
      titulo: c.titulo,
      descricao: c.descricao ?? "",
      local: c.local ?? "Auditório Principal Ágora",
      inicio: toLocalInput(c.inicio),
      fim: toLocalInput(c.fim),
      vagas: c.vagas ? String(c.vagas) : "",
      ativa: c.ativa,
    });
    setOpenStaff(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (new Date(form.fim) <= new Date(form.inicio)) {
        throw new Error("A data final precisa ser posterior à inicial.");
      }
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        ministrante: form.ministrante.trim() || null,
        local: form.local.trim() || null,
        inicio: new Date(form.inicio).toISOString(),
        fim: new Date(form.fim).toISOString(),
        vagas: form.vagas ? Number(form.vagas) : null,
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
      const notifiedCount = entities.filter((e) => e.receber_avisos_email !== false).length;
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
      if (new Date(staffForm.fim) <= new Date(staffForm.inicio)) {
        throw new Error("A data final precisa ser posterior à inicial.");
      }
      const payload = {
        titulo: staffForm.titulo.trim(),
        descricao: staffForm.descricao.trim() || null,
        local: staffForm.local.trim() || null,
        inicio: new Date(staffForm.inicio).toISOString(),
        fim: new Date(staffForm.fim).toISOString(),
        vagas: staffForm.vagas ? Number(staffForm.vagas) : null,
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
              perMember={CREDITS_PER_TRAINING_MEMBER}
              perEvent={CREDITS_PER_TRAINING_EVENT}
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
              perMember={CREDITS_PER_STAFF_MEMBER}
              perEvent={CREDITS_PER_STAFF_EVENT}
              className="text-xs text-amber-800"
            />
            {isPast && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                Encerrado
              </span>
            )}
            {!c.ativa && <span className="text-xs text-muted-foreground">(Inativo)</span>}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{c.titulo}</h3>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacitações UNI & Chamados de Staff"
        description="Publique treinamentos oficiais da Liga UNI e convoque equipes para atuarem como Staff em grandes eventos do Ágora Tech Park."
        action={
          section === "capacitacoes" ? (
            <Button variant="hero" onClick={openNew}>
              <Plus className="size-4" /> Nova capacitação
            </Button>
          ) : (
            <Button variant="hero" onClick={openNewStaff}>
              <Plus className="size-4" /> Novo chamado de Staff
            </Button>
          )
        }
      />

      {/* Seletor entre Capacitações UNI e Chamados de Staff */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setSection("capacitacoes")}
          className={
            section === "capacitacoes"
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
            section === "staff"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <HandHelping className="size-4" />
          Chamados de Staff em Eventos ({staffCalls.length})
        </button>
      </div>

      {section === "capacitacoes" ? (
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
      ) : staffCalls.length === 0 ? (
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
              <Label>Título</Label>
              <Input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
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
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.inicio}
                  onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.fim}
                  onChange={(e) => setForm({ ...form, fim: e.target.value })}
                />
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
              <Label>Título do evento</Label>
              <Input
                required
                value={staffForm.titulo}
                onChange={(e) => setStaffForm({ ...staffForm, titulo: e.target.value })}
                placeholder="Ex.: Staff — Ágora Tech Summit 2026"
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
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  required
                  value={staffForm.inicio}
                  onChange={(e) => setStaffForm({ ...staffForm, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="datetime-local"
                  required
                  value={staffForm.fim}
                  onChange={(e) => setStaffForm({ ...staffForm, fim: e.target.value })}
                />
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
    </div>
  );
}
