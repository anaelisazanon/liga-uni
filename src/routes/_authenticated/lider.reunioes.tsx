import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Coins,
  History,
  MapPin,
  Megaphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CoinPerPersonTag, PageHeader } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  calcMeetingCoins,
  countParticipants,
  CREDITS_PER_MEETING_EVENT,
  CREDITS_PER_MEETING_MEMBER,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  membersQuery,
  myEntityQuery,
  type GeneralMeeting,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/reunioes")({
  head: () => ({ meta: [{ title: "Reuniões Liga UNI" }] }),
  component: LiderReunioesPage,
});

function parseSelectedNames(str: string): string[] {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function LiderReunioesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: myAttendances = [] } = useQuery({
    ...meetingAttendancesQuery(entity?.id),
    enabled: !!entity?.id,
  });
  const { data: members = [] } = useQuery({
    ...membersQuery(entity?.id),
    enabled: !!entity?.id,
  });

  const [selected, setSelected] = useState<GeneralMeeting | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [pastOpen, setPastOpen] = useState(false);

  const toggleName = (nome: string) => {
    if (selectedNames.includes(nome)) {
      setSelectedNames(selectedNames.filter((n) => n !== nome));
    } else {
      setSelectedNames([...selectedNames, nome]);
    }
  };

  const confirmPresence = useMutation({
    mutationFn: async () => {
      if (!selected || !entity) return 0;
      if (selectedNames.length === 0) {
        throw new Error("Selecione pelo menos um membro participante da sua equipe.");
      }
      const representantes = selectedNames.join(", ");
      const existing = myAttendances.find((a) => a.meeting_id === selected.id);
      if (existing) {
        const { error } = await supabase
          .from("meeting_attendances")
          .update({ representantes, presente: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meeting_attendances").insert({
          meeting_id: selected.id,
          entity_id: entity.id,
          representantes,
          presente: true,
          moedas_liberadas: false,
        });
        if (error) throw error;
      }
      return calcMeetingCoins(selectedNames.length);
    },
    onSuccess: (totalCoins) => {
      setSelected(null);
      setSelectedNames([]);
      toast.success(
        `Participantes registrados! Após a reunião, o administrador validará a chamada para liberar +${totalCoins} LigaCoins.`,
      );
      qc.invalidateQueries({ queryKey: ["meeting-attendances"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const now = new Date();
  const upcomingMeetings = meetings
    .filter((m) => m.ativa && new Date(m.fim) >= now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  const pastMeetings = meetings
    .filter((m) => new Date(m.fim) < now || !m.ativa)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const modalTotalCoins = calcMeetingCoins(selectedNames.length);

  const renderMeetingHorizontalCard = (m: GeneralMeeting, isPast: boolean) => {
    const att = myAttendances.find((a) => a.meeting_id === m.id && a.presente);
    const count = att ? Math.max(1, countParticipants(att.representantes)) : 0;
    const totalCoins = calcMeetingCoins(count);
    const isEnrolledUpcoming = Boolean(att && !isPast);
    const isCredited = Boolean(att && isPast && att.moedas_liberadas);

    return (
      <Card
        key={m.id}
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
                    : "bg-amber-500/15 text-amber-600"
              }`}
            >
              <Megaphone className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-semibold text-base leading-snug ${
                    isPast ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {m.titulo}
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
                {m.obrigatoria && !isPast && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
                    <AlertCircle className="h-3 w-3" /> Presença Obrigatória
                  </span>
                )}
                {att ? (
                  isCredited ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> +{totalCoins} LC creditadas
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                      <Coins className="h-3.5 w-3.5" /> +{totalCoins} LC pós-reunião
                    </span>
                  )
                ) : (
                  <CoinPerPersonTag
                    perMember={CREDITS_PER_MEETING_MEMBER}
                    perEvent={CREDITS_PER_MEETING_EVENT}
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                      isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  />
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Pauta: </span>
                {m.pauta}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {fmtDateTime(m.inicio)} – {fmtDateTime(m.fim)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {m.local}
                </span>
              </div>

              {att && (
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
                    {count} representante(s) inscrito(s) (+{totalCoins} LigaCoins):{" "}
                  </span>
                  <span className="text-foreground">{att.representantes}</span>
                </div>
              )}
            </div>
          </div>

          {!isPast && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
              {att ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedNames(parseSelectedNames(att.representantes));
                    setSelected(m);
                  }}
                >
                  Editar participantes ({count})
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedNames(members.slice(0, 2).map((mem) => mem.nome));
                    setSelected(m);
                  }}
                >
                  <Users className="mr-1.5 h-4 w-4" />
                  <span>Selecionar participantes</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Reuniões Liga UNI"
        description="Encontros oficiais de alinhamento das entidades estudantis no Ágora Tech Park"
      />

      <p className="mb-6 text-sm text-muted-foreground">
        As Reuniões Liga UNI são convocadas pela coordenação do Liga Ágora para alinhar o
        calendário semestral, uso de espaços, mostras tecnológicas e integração entre todas as
        entidades e projetos universitários participantes.
      </p>

      {upcomingMeetings.length === 0 && (
        <p className="text-muted-foreground">Nenhuma próxima reunião convocada no momento.</p>
      )}

      <div className="space-y-3">
        {upcomingMeetings.map((m) => renderMeetingHorizontalCard(m, false))}
      </div>

      {pastMeetings.length > 0 && (
        <div className="mt-6 rounded-xl border border-border/80 bg-muted/30">
          <button
            type="button"
            onClick={() => setPastOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          >
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-muted-foreground" />
              <span>Reuniões que já aconteceram ({pastMeetings.length})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span>{pastOpen ? "Ocultar realizadas" : "Ver realizadas"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  pastOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {pastOpen && (
            <div className="space-y-3 border-t border-border/60 p-4">
              {pastMeetings.map((m) => renderMeetingHorizontalCard(m, true))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar participantes para a Reunião Liga UNI</DialogTitle>
          </DialogHeader>
          {selected && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                confirmPresence.mutate();
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">{selected.titulo}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(selected.inicio)} · {selected.local}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Selecione os membros que representarão sua entidade</Label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedNames(members.map((m) => m.nome))}
                      className="font-medium text-primary hover:underline"
                    >
                      Selecionar todos
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNames([])}
                      className="text-muted-foreground hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {members.length === 0 ? (
                  <p className="rounded-lg border p-3 text-xs text-muted-foreground">
                    Nenhum membro cadastrado na equipe ainda. Clique no nome do seu projeto na barra
                    lateral para cadastrar membros.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border bg-muted/20 p-2.5">
                    {members.map((m) => {
                      const checked = selectedNames.includes(m.nome);
                      return (
                        <label
                          key={m.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                            checked
                              ? "border-primary bg-primary/5 font-medium"
                              : "bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleName(m.nome)}
                            />
                            <div>
                              <div className="text-foreground">{m.nome}</div>
                              {m.curso && (
                                <div className="text-[11px] text-muted-foreground">{m.curso}</div>
                              )}
                            </div>
                          </div>
                          <CoinPerPersonTag
                            perMember={CREDITS_PER_MEETING_MEMBER}
                            className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    <b>{selectedNames.length}</b> representante(s) × {CREDITS_PER_MEETING_MEMBER} LC
                    +{CREDITS_PER_MEETING_EVENT} LC da reunião
                  </span>
                  <span className="inline-flex items-center gap-1 font-display text-sm font-bold text-amber-600">
                    <Coins className="h-3.5 w-3.5" /> +{modalTotalCoins} LigaCoins
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={confirmPresence.isPending || selectedNames.length === 0}
                >
                  Confirmar ({selectedNames.length} participante(s))
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
