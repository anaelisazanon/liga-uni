import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateSemesterRequirements,
  CURRENT_SEMESTER_LABEL,
  entitiesQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  membersQuery,
  peerWorkshopsQuery,
  profilesQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  type Entity,
  type SemesterRequirementsSummary,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/pendencias-semestrais")({
  head: () => ({ title: "Pendências Semestrais — Admin Liga UNI" }),
  component: AdminPendenciasSemestraisPage,
});

function AdminPendenciasSemestraisPage() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());

  const [emailModal, setEmailModal] = useState<{
    entity: Entity;
    reqs: SemesterRequirementsSummary;
    leaderEmail: string;
    leaderName: string;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sentIds, setSentIds] = useState<string[]>([]);

  const nonCompliantEntities = entities
    .map((e) => ({
      entity: e,
      reqs: calculateSemesterRequirements({
        entityId: e.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      }),
    }))
    .filter((x) => !x.reqs.isCompliant)
    .sort((a, b) => a.reqs.fulfilledCount - b.reqs.fulfilledCount);

  const getLeaderInfo = (ent: Entity) => {
    const p = profiles.find((pr) => pr.id === ent.leader_id);
    if (p) return { name: p.nome, email: p.email };
    const firstMem = members.find((m) => m.entity_id === ent.id);
    return {
      name: firstMem?.nome ?? `Líder — ${ent.nome}`,
      email: firstMem?.email ?? "lider@projeto.ufsc.br",
    };
  };

  const openEmailDialog = (ent: Entity, reqs: SemesterRequirementsSummary) => {
    const leader = getLeaderInfo(ent);
    const missingList = reqs.items
      .filter((i) => !i.fulfilled)
      .map((i) => `• ${i.title}: ${i.statusText} (realizado ${i.current}/${i.target})`)
      .join("\n");

    setCustomMessage(
      `Olá, ${leader.name}!\n\nIdentificamos no sistema da Liga UNI (Ágora Tech Park) que a equipe ${ent.nome} possui exigências semestrais pendentes no semestre ${CURRENT_SEMESTER_LABEL} (${reqs.fulfilledCount}/${reqs.totalRequirements} metas cumpridas):\n\n${missingList}\n\nLembramos que o cumprimento das metas é renovado a cada semestre para manter os benefícios e acesso às salas do Ágora. Acesse o portal da Liga UNI para inscrever sua equipe nas próximas atividades.\n\nAtenciosamente,\nCoordenação Liga UNI — Ágora Tech Park`,
    );
    setEmailModal({
      entity: ent,
      reqs,
      leaderEmail: leader.email,
      leaderName: leader.name,
    });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal) return;
    setSentIds((prev) =>
      prev.includes(emailModal.entity.id) ? prev : [...prev, emailModal.entity.id],
    );
    toast.success(
      `E-mail de alerta sobre pendências semestrais enviado para ${emailModal.leaderName} (${emailModal.leaderEmail})!`,
    );
    setEmailModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs text-muted-foreground">
          <Link to="/admin">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar para Visão Geral
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Alerta de Permanência Semestral"
        description={`Acompanhamento das equipes com exigências pendentes no semestre ${CURRENT_SEMESTER_LABEL} e envio de notificação por e-mail aos líderes.`}
      />

      <div className="rounded-2xl border border-destructive/35 bg-destructive/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive font-display text-lg font-black text-destructive-foreground">
              !
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {nonCompliantEntities.length} equipe(s) com exigências pendentes no semestre{" "}
                  {CURRENT_SEMESTER_LABEL}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <RefreshCw className="h-3 w-3" /> Metas renovadas todo semestre
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Regras semestrais: presença em 100% das Reuniões Liga UNI, 2 atuações como Staff, 2
                Capacitações UNI e 1 Oficina oferecida.
              </p>
            </div>
          </div>
        </div>
      </div>

      {nonCompliantEntities.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          Todas as entidades cumpriram 100% das exigências semestrais!
        </Card>
      ) : (
        <div className="space-y-4">
          {nonCompliantEntities.map(({ entity: ent, reqs }) => {
            const leader = getLeaderInfo(ent);
            const entMembers = members.filter((m) => m.entity_id === ent.id);
            const alreadySent = sentIds.includes(ent.id);

            return (
              <Card
                key={ent.id}
                className="border-2 border-destructive/35 bg-card p-5 shadow-card space-y-4"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-lg font-bold text-foreground">{ent.nome}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> {reqs.fulfilledCount}/
                        {reqs.totalRequirements} exigências cumpridas
                      </span>
                      {alreadySent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> E-mail enviado ao líder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{ent.descricao}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Líder: <b>{leader.name}</b> ({leader.email})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {entMembers.length} membro(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={alreadySent ? "outline" : "default"}
                      onClick={() => openEmailDialog(ent, reqs)}
                    >
                      <Mail className="mr-1.5 h-4 w-4" />
                      {alreadySent
                        ? "Reenviar e-mail sobre pendências"
                        : "Enviar e-mail sobre pendências ao líder"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {reqs.items.map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-xl border p-3 text-xs ${
                        item.fulfilled
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-destructive/35 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{item.shortTitle}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            item.fulfilled
                              ? "bg-emerald-500/15 text-emerald-700"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {item.current}/{item.target}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.ruleDescription}
                      </p>
                      <div
                        className={`mt-2 text-[11px] font-bold ${
                          item.fulfilled ? "text-emerald-700" : "text-destructive"
                        }`}
                      >
                        {item.fulfilled ? "✓ Meta cumprida" : `• Pendente: ${item.statusText}`}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!emailModal} onOpenChange={(o) => !o && setEmailModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar e-mail sobre pendências semestrais ao líder</DialogTitle>
          </DialogHeader>
          {emailModal && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">Equipe:</span>{" "}
                  <strong className="text-foreground">{emailModal.entity.nome}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Destinatário (Líder):</span>{" "}
                  <strong className="text-foreground">
                    {emailModal.leaderName} &lt;{emailModal.leaderEmail}&gt;
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Assunto:</span>{" "}
                  <strong className="text-foreground">
                    [Liga UNI] Pendências Semestrais ({CURRENT_SEMESTER_LABEL}) —{" "}
                    {emailModal.entity.nome}
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Mensagem para o líder da equipe</Label>
                <Textarea
                  required
                  rows={9}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailModal(null)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Send className="mr-1.5 h-4 w-4" /> Enviar e-mail ao líder
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
