import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Mail,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateSemesterRequirements,
  CURRENT_SEMESTER_LABEL,
  downloadCsvFile,
  entitiesQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  membersQuery,
  peerWorkshopsQuery,
  portalConfigQuery,
  profilesQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  type Entity,
  type SemesterRequirementsSummary,
} from "@/lib/data";

type FilterMode = "all" | "pending" | "compliant";

export function AdminTeamsPendingDashboard({
  defaultFilter = "pending",
  compactHeader = false,
}: {
  defaultFilter?: FilterMode;
  compactHeader?: boolean;
}) {
  const qc = useQueryClient();
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: portalConfig } = useQuery(portalConfigQuery);

  const semesterLabel = portalConfig?.semesterLabel ?? CURRENT_SEMESTER_LABEL;

  const [filterMode, setFilterMode] = useState<FilterMode>(defaultFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<{
    entity: Entity;
    reqs: SemesterRequirementsSummary;
    leaderName: string;
    leaderEmail: string;
    membersCount: number;
  } | null>(null);
  const [emailText, setEmailText] = useState("");
  const [sentIds, setSentIds] = useState<string[]>([]);

  const getLeaderInfo = (ent: Entity) => {
    const p = profiles.find((pr) => pr.id === ent.leader_id);
    if (p) return { name: p.nome, email: p.email };
    const firstMem = members.find((m) => m.entity_id === ent.id);
    return {
      name: firstMem?.nome ?? `Líder — ${ent.nome}`,
      email: firstMem?.email ?? "lider@projeto.ufsc.br",
    };
  };

  const teamsWithReqs = entities
    .map((entity) => {
      const reqs = calculateSemesterRequirements({
        entityId: entity.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      });
      const leader = getLeaderInfo(entity);
      const membersCount = members.filter((m) => m.entity_id === entity.id).length;
      return {
        entity,
        reqs,
        leaderName: leader.name,
        leaderEmail: leader.email,
        membersCount,
      };
    })
    .sort((a, b) => {
      if (b.reqs.missingRequirementsCount !== a.reqs.missingRequirementsCount) {
        return b.reqs.missingRequirementsCount - a.reqs.missingRequirementsCount;
      }
      return a.entity.nome.localeCompare(b.entity.nome);
    });

  const nonCompliantCount = teamsWithReqs.filter((t) => !t.reqs.isCompliant).length;
  const compliantCount = teamsWithReqs.length - nonCompliantCount;

  const filteredTeams = teamsWithReqs.filter((item) => {
    if (filterMode === "pending" && item.reqs.isCompliant) return false;
    if (filterMode === "compliant" && !item.reqs.isCompliant) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.entity.nome.toLowerCase().includes(q) ||
        item.leaderName.toLowerCase().includes(q) ||
        item.leaderEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const buildDefaultEmailMessage = (
    ent: Entity,
    reqs: SemesterRequirementsSummary,
    leaderName: string,
  ) => {
    const missingItems = reqs.items.filter((i) => !i.fulfilled);
    if (missingItems.length === 0) {
      return `Olá, ${leaderName}!\n\nParabéns! A coordenação da Liga UNI (Ágora Tech Park) confirma que a equipe ${ent.nome} cumpriu 100% das exigências semestrais do semestre ${semesterLabel} (${reqs.fulfilledCount}/${reqs.totalRequirements} metas concluídas).\n\nAtenciosamente,\nCoordenação Liga UNI — Ágora Tech Park`;
    }

    const missingList = missingItems
      .map((i) => `• ${i.title}: ${i.statusText} (realizado ${i.current}/${i.target})`)
      .join("\n");

    return `Olá, ${leaderName}!\n\nIdentificamos no sistema da Liga UNI (Ágora Tech Park) que a equipe ${ent.nome} possui ${reqs.missingRequirementsCount} exigência(s) semestral(is) pendente(s) no semestre ${semesterLabel} (${reqs.fulfilledCount}/${reqs.totalRequirements} metas cumpridas):\n\n${missingList}\n\nLembramos que o cumprimento das metas é renovado a cada semestre para manter os benefícios e o acesso às salas do Ágora Tech Park. Acesse o portal da Liga UNI para inscrever sua equipe nas próximas atividades.\n\nAtenciosamente,\nCoordenação Liga UNI — Ágora Tech Park`;
  };

  const openTeamDetails = (item: (typeof teamsWithReqs)[number]) => {
    setSelectedTeam(item);
    setEmailText(buildDefaultEmailMessage(item.entity, item.reqs, item.leaderName));
  };

  const handleExportPendenciasCsv = () => {
    const rows: (string | number | null | undefined)[][] = [
      [
        "Semestre",
        "Equipe",
        "Categoria",
        "Líder Responsável",
        "E-mail do Líder",
        "Membros Cadastrados",
        "Status Semestral",
        "Qtd. Pendências",
        "Metas Cumpridas",
        "Reuniões Liga UNI",
        "Staff em Eventos",
        "Capacitações UNI",
        "Oficinas Oferecidas",
        "Detalhamento das Pendências",
      ],
      ...filteredTeams.map((item) => {
        const { entity, reqs, leaderName, leaderEmail, membersCount } = item;
        const rMeeting = reqs.items.find((i) => i.key === "reunioes");
        const rStaff = reqs.items.find((i) => i.key === "staff");
        const rTrain = reqs.items.find((i) => i.key === "capacitacoes");
        const rWork = reqs.items.find((i) => i.key === "oficinas");
        const pendingDetails =
          reqs.items
            .filter((i) => !i.fulfilled)
            .map((i) => `${i.title}: ${i.current}/${i.target}`)
            .join(" | ") || "Nenhuma pendência (100% em dia)";

        return [
          semesterLabel,
          entity.nome,
          entity.categoria,
          leaderName,
          leaderEmail,
          membersCount,
          reqs.isCompliant ? "EM DIA" : "COM PENDÊNCIAS",
          reqs.missingRequirementsCount,
          `${reqs.fulfilledCount}/${reqs.totalRequirements}`,
          rMeeting ? `${rMeeting.current}/${rMeeting.target}` : "-",
          rStaff ? `${rStaff.current}/${rStaff.target}` : "-",
          rTrain ? `${rTrain.current}/${rTrain.target}` : "-",
          rWork ? `${rWork.current}/${rWork.target}` : "-",
          pendingDetails,
        ];
      }),
    ];

    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`auditoria_pendencias_equipes_${dateStamp}.csv`, rows);
    toast.success(
      `Arquivo CSV com ${filteredTeams.length} equipe(s) e pendências semestrais exportado para auditoria!`,
    );
  };

  const sendReminderEmail = useMutation({
    mutationFn: async () => {
      if (!selectedTeam) return;
      const body = emailText.trim();
      if (!body) throw new Error("Escreva a mensagem do e-mail antes de enviar.");

      // Também registra um comunicado na caixa de Chamados da equipe para histórico no portal
      await supabase.from("admin_messages").insert({
        entity_id: selectedTeam.entity.id,
        topico: "Outros Assuntos",
        assunto: `[Cobrança Semestral ${semesterLabel}] ${selectedTeam.reqs.missingRequirementsCount} pendência(s) — ${selectedTeam.entity.nome}`,
        mensagem: `Notificação automática de cobrança de metas semestrais enviada ao líder ${selectedTeam.leaderName} (${selectedTeam.leaderEmail}).`,
        resposta: body,
        status: "answered",
      });
    },
    onSuccess: () => {
      if (!selectedTeam) return;
      setSentIds((prev) =>
        prev.includes(selectedTeam.entity.id) ? prev : [...prev, selectedTeam.entity.id],
      );
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success(
        `E-mail de cobrança enviado com sucesso para ${selectedTeam.leaderName} (${selectedTeam.leaderEmail})!`,
      );
      setSelectedTeam(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
      {/* Cabeçalho do Componente de Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Building2 className="size-3.5" /> Monitoramento de Equipes ({teamsWithReqs.length})
            </span>
            {nonCompliantCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                <AlertTriangle className="size-3.5" /> {nonCompliantCount} com pendências
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <RefreshCw className="size-3" /> Semestre {semesterLabel}
            </span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            {compactHeader
              ? "Equipes Cadastradas & Contador de Pendências Semestrais"
              : "Painel Geral de Equipes & Pendências Semestrais"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Clique em qualquer equipe abaixo para inspecionar o detalhamento das metas semestrais e
            disparar um e-mail de cobrança diretamente para o respectivo líder.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPendenciasCsv}
          >
            <Download className="mr-1.5 size-3.5 text-primary" /> Exportar Pendências (CSV)
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/configuracoes" search={{ tab: "regras" }}>
              <Settings2 className="mr-1.5 size-3.5 text-primary" /> Configurar metas
            </Link>
          </Button>
          {compactHeader && (
            <Button variant="default" size="sm" asChild>
              <Link to="/admin/pendencias-semestrais">
                Página exclusiva de pendências <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filtros Rápidos e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode("pending")}
            className={
              filterMode === "pending"
                ? "inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-xs"
                : "inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            }
          >
            <AlertTriangle className="size-3.5" /> Somente com pendências ({nonCompliantCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={
              filterMode === "all"
                ? "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs"
                : "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            Mostrar todas as equipes ({teamsWithReqs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("compliant")}
            className={
              filterMode === "compliant"
                ? "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                : "inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/10"
            }
          >
            <CheckCircle2 className="size-3.5" /> Em dia ({compliantCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar equipe ou líder..."
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Lista Horizontal de Equipes com Contador de Pendências em Destaque */}
      {filteredTeams.length === 0 ? (
        <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          Nenhuma equipe encontrada para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((item) => {
            const { entity: ent, reqs, leaderName, leaderEmail } = item;
            const pendingCount = reqs.missingRequirementsCount;
            const isPending = pendingCount > 0;
            const alreadySent = sentIds.includes(ent.id);

            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => openTeamDetails(item)}
                className={`group flex w-full flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-elevated ${
                  isPending
                    ? "border-2 border-destructive/45 bg-destructive/5 hover:border-destructive"
                    : "border-border bg-background/60 hover:border-primary/40"
                }`}
              >
                {/* Esquerda: Contador em destaque + Nome da equipe e Líder */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 lg:w-[34%] shrink-0">
                  <div
                    className={`flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center shadow-2xs ${
                      isPending
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                    }`}
                  >
                    <span className="font-display text-xl font-black leading-none">
                      {pendingCount}
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider leading-none">
                      {pendingCount === 1 ? "Pendência" : "Pendências"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm sm:text-base font-bold text-foreground group-hover:text-primary truncate">
                      {ent.nome}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Líder: <strong className="text-foreground">{leaderName}</strong> ·{" "}
                      <span>{leaderEmail}</span>
                    </p>
                  </div>
                </div>

                {/* Centro: As 4 exigências semestrais alinhadas na horizontal */}
                <div className="grid flex-1 grid-cols-2 sm:grid-cols-4 gap-2">
                  {reqs.items.map((reqItem) => (
                    <div
                      key={reqItem.key}
                      className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
                        reqItem.fulfilled
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                          : "border-destructive/30 bg-destructive/15 text-destructive font-semibold"
                      }`}
                    >
                      <span className="truncate">{reqItem.shortTitle}</span>
                      <span className="shrink-0 font-bold">
                        {reqItem.current}/{reqItem.target}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Direita: Ação de cobrar líder por e-mail / ver detalhes */}
                <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 border-t border-border/60 pt-2.5 lg:border-t-0 lg:pt-0">
                  {alreadySent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> Cobrança enviada
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-2xs group-hover:bg-destructive/90">
                      <Mail className="size-3.5" /> Cobrar líder por e-mail
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      <Users className="size-3.5" /> Ver detalhes
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Equipe + Disparo de E-mail de Cobrança */}
      <Dialog open={!!selectedTeam} onOpenChange={(o) => !o && setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>{selectedTeam?.entity.nome}</span>
              {selectedTeam && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedTeam.reqs.missingRequirementsCount > 0
                      ? "bg-destructive/15 text-destructive"
                      : "bg-emerald-500/15 text-emerald-700"
                  }`}
                >
                  {selectedTeam.reqs.missingRequirementsCount > 0 ? (
                    <>
                      <AlertTriangle className="size-3.5" />{" "}
                      {selectedTeam.reqs.missingRequirementsCount} pendência(s) no semestre
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" /> 0 pendências (Em dia)
                    </>
                  )}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTeam && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendReminderEmail.mutate();
              }}
              className="space-y-4"
            >
              {/* Dados do Líder e Equipe */}
              <div className="rounded-xl border bg-muted/30 p-3.5 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Líder responsável:</span>{" "}
                    <strong className="text-foreground">{selectedTeam.leaderName}</strong> (
                    <span className="text-primary font-medium">{selectedTeam.leaderEmail}</span>)
                  </div>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Users className="size-3.5" /> {selectedTeam.membersCount} integrantes
                  </span>
                </div>
                {selectedTeam.entity.descricao && (
                  <p className="text-muted-foreground pt-1">{selectedTeam.entity.descricao}</p>
                )}
              </div>

              {/* Detalhamento das 4 Exigências Semestrais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Detalhamento das Exigências Semestrais ({semesterLabel})</span>
                  <span>
                    {selectedTeam.reqs.fulfilledCount}/{selectedTeam.reqs.totalRequirements}{" "}
                    cumpridas
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {selectedTeam.reqs.items.map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-xl border p-3 text-xs ${
                        item.fulfilled
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-destructive/40 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{item.title}</span>
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
                        className={`mt-1.5 text-[11px] font-bold ${
                          item.fulfilled ? "text-emerald-700" : "text-destructive"
                        }`}
                      >
                        {item.fulfilled ? "✓ Meta cumprida" : `• Pendente: ${item.statusText}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disparo de E-mail de Cobrança */}
              <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Mail className="size-4" /> Disparar E-mail de Cobrança / Notificação ao Líder
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Para: <b>{selectedTeam.leaderEmail}</b>
                  </span>
                </div>
                <Textarea
                  required
                  rows={7}
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="bg-background text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  O líder receberá este e-mail com o resumo das pendências e a mensagem também
                  ficará registrada nos <b>Chamados</b> da equipe no portal.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedTeam(null)}>
                  Fechar
                </Button>
                <Button
                  type="submit"
                  variant={
                    selectedTeam.reqs.missingRequirementsCount > 0 ? "destructive" : "default"
                  }
                  disabled={sendReminderEmail.isPending}
                >
                  <Send className="mr-1.5 size-4" />
                  {sendReminderEmail.isPending
                    ? "Enviando..."
                    : selectedTeam.reqs.missingRequirementsCount > 0
                      ? "Disparar e-mail de cobrança ao líder"
                      : "Enviar e-mail ao líder"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
