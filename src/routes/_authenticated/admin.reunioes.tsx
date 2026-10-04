import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  History,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
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
  calcMeetingCoins,
  countParticipants,
  CREDITS_PER_MEETING_EVENT,
  CREDITS_PER_MEETING_MEMBER,
  entitiesQuery,
  type GeneralMeeting,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  roomsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/reunioes")({
  head: () => ({ meta: [{ title: "Reuniões Liga UNI — Admin Liga UNI" }] }),
  component: AdminReunioesPage,
});

const emptyForm = {
  titulo: "",
  pauta: "",
  local: "Auditório Principal Ágora",
  inicio: "",
  fim: "",
  creditos_recompensa: CREDITS_PER_MEETING_EVENT,
  ativa: true,
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminReunioesPage() {
  const qc = useQueryClient();
  const { data: meetings = [], isLoading } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralMeeting | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPast, setShowPast] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (m: GeneralMeeting) => {
    setEditing(m);
    setForm({
      titulo: m.titulo,
      pauta: m.pauta ?? "",
      local: m.local ?? "Auditório Principal Ágora",
      inicio: toLocalInput(m.inicio),
      fim: toLocalInput(m.fim),
      creditos_recompensa: m.creditos_recompensa || CREDITS_PER_MEETING_EVENT,
      ativa: m.ativa,
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (new Date(form.fim) <= new Date(form.inicio)) {
        throw new Error("A data final precisa ser posterior à inicial.");
      }
      const payload = {
        titulo: form.titulo.trim(),
        pauta: form.pauta.trim() || null,
        local: form.local.trim() || null,
        inicio: new Date(form.inicio).toISOString(),
        fim: new Date(form.fim).toISOString(),
        creditos_recompensa: Number(form.creditos_recompensa) || CREDITS_PER_MEETING_EVENT,
        ativa: form.ativa,
      };
      if (editing) {
        const { error } = await supabase
          .from("general_meetings")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("general_meetings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-meetings"] });
      const notifiedCount = entities.filter((e) => e.receber_avisos_email !== false).length;
      toast.success(
        editing
          ? "Reunião atualizada!"
          : `Reunião convocada! Aviso enviado por e-mail para ${notifiedCount} líder(es) com notificações ativas.`,
      );
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("general_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-meetings"] });
      toast.success("Reunião removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCoins = useMutation({
    mutationFn: async ({
      meetingId,
      entityId,
      moedas_liberadas,
      existingId,
    }: {
      meetingId: string;
      entityId: string;
      moedas_liberadas: boolean;
      existingId?: string;
    }) => {
      if (existingId) {
        const { error } = await supabase
          .from("meeting_attendances")
          .update({ presente: true, moedas_liberadas })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meeting_attendances").insert({
          meeting_id: meetingId,
          entity_id: entityId,
          presente: true,
          moedas_liberadas,
          representantes: "Representante validado pelo Admin",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meeting-attendances"] });
      toast.success("Status de LigaCoins atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();
  const upcomingMeetings = [...meetings]
    .filter((m) => new Date(m.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const pastMeetings = [...meetings]
    .filter((m) => new Date(m.fim) < now)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const renderMeetingCard = (m: GeneralMeeting, isPast: boolean) => {
    const meetingAtt = attendances.filter((a) => a.meeting_id === m.id && a.presente);
    const pendingLcCount = meetingAtt.filter((a) => !a.moedas_liberadas).length;
    const baseBonus = m.creditos_recompensa || CREDITS_PER_MEETING_EVENT;

    return (
      <div
        key={m.id}
        className={
          isPast
            ? "rounded-xl border border-border bg-muted/40 p-5 text-muted-foreground transition-colors"
            : "rounded-xl border border-border bg-card p-6 shadow-card"
        }
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Megaphone className="size-3.5" /> Reunião Geral Liga UNI
              </span>
              <CoinPerPersonTag
                perMember={CREDITS_PER_MEETING_MEMBER}
                perEvent={baseBonus}
                className="text-xs text-amber-800"
              />
              {isPast && (
                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
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
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {pendingLcCount > 0 && (
              <Button size="sm" variant="default" asChild>
                <Link to="/admin/aprovacoes" search={{ tab: "reunioes-uni" }}>
                  Liberar LC ({pendingLcCount}) <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
              <Pencil className="size-3.5" /> Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => remove.mutate(m.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Presença e liberação de LigaCoins por entidade */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" /> Equipes confirmadas e liberação de LigaCoins (
              {meetingAtt.length}/{entities.length})
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((ent) => {
              const record = meetingAtt.find((a) => a.entity_id === ent.id);
              const isPresent = !!record?.presente;
              const coinsReleased = !!record?.moedas_liberadas;
              const repCount = record
                ? Math.max(1, countParticipants(record.representantes))
                : 1;
              const totalCoins = calcMeetingCoins(repCount);
              return (
                <div
                  key={ent.id}
                  className={
                    coinsReleased
                      ? "flex flex-col justify-between gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-xs"
                      : isPresent
                        ? "flex flex-col justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs"
                        : "flex flex-col justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground"
                  }
                >
                  <div>
                    <div className="font-semibold text-foreground flex items-center justify-between gap-1">
                      <span className="truncate">{ent.nome}</span>
                      {isPresent && (
                        <span className="inline-flex items-center gap-0.5 font-bold text-amber-800">
                          +{totalCoins} <Coins className="size-3" />
                        </span>
                      )}
                    </div>
                    {record?.representantes ? (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {repCount} representante(s): {record.representantes}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Ainda não confirmou presença
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/50">
                    <Button
                      size="sm"
                      variant={coinsReleased ? "outline" : "default"}
                      className="h-7 text-[11px] px-2.5"
                      onClick={() =>
                        toggleCoins.mutate({
                          meetingId: m.id,
                          entityId: ent.id,
                          moedas_liberadas: !coinsReleased,
                          existingId: record?.id,
                        })
                      }
                    >
                      {coinsReleased ? (
                        <>
                          <CheckCircle2 className="size-3 text-success mr-1" /> +{totalCoins} LC
                          liberadas
                        </>
                      ) : (
                        <>
                          <Coins className="size-3 mr-1" /> Liberar +{totalCoins} LC
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reuniões Gerais da Liga UNI"
        description={`Convoque reuniões de alinhamento e valide a presença dos representantes (+${CREDITS_PER_MEETING_MEMBER} LC por representante + ${CREDITS_PER_MEETING_EVENT} LC por reunião).`}
        action={
          <Button variant="hero" onClick={openNew}>
            <Plus className="size-4" /> Nova reunião geral
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
          <Megaphone className="size-8 text-muted-foreground mx-auto" />
          <div className="font-display font-semibold">Nenhuma reunião convocada</div>
          <p className="text-sm text-muted-foreground">
            Crie reuniões gerais para alinhar as entidades universitárias e bonificar a presença com
            LigaCoins.
          </p>
          <Button variant="default" onClick={openNew}>
            <Plus className="size-4" /> Criar reunião
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Nenhuma reunião futura agendada no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((m) => renderMeetingCard(m, false))}
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 hover:bg-muted px-4 py-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                  <History className="size-4" />
                  <span>Reuniões já realizadas ({pastMeetings.length})</span>
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
                  {pastMeetings.map((m) => renderMeetingCard(m, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar reunião geral" : "Convocar nova reunião Liga UNI"}
            </DialogTitle>
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
                placeholder="Ex.: 2ª Reunião Geral de Alinhamento Liga UNI"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pauta e objetivos</Label>
              <Textarea
                rows={3}
                value={form.pauta}
                onChange={(e) => setForm({ ...form, pauta: e.target.value })}
                placeholder="Principais tópicos que serão discutidos com os líderes..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label>
                  Bônus base da reunião (+{CREDITS_PER_MEETING_MEMBER} LC/rep)
                </Label>
                <Input
                  type="number"
                  min={5}
                  max={200}
                  required
                  value={form.creditos_recompensa}
                  onChange={(e) =>
                    setForm({ ...form, creditos_recompensa: Number(e.target.value) })
                  }
                />
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
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Reunião ativa</div>
                <div className="text-xs text-muted-foreground">
                  Visível para confirmação de presença dos líderes
                </div>
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
    </div>
  );
}
