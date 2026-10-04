import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/auth";
import {
  adminActionLogQuery,
  type AdminActionLogEntry,
  calcMeetingCoins,
  calcStaffCoins,
  calcTrainingCoins,
  calcWorkshopCoins,
  calculateSemesterRequirements,
  countParticipants,
  CURRENT_SEMESTER_LABEL,
  downloadCsvFile,
  entitiesQuery,
  generalMeetingsQuery,
  leaderRequestsQuery,
  meetingAttendancesQuery,
  membersQuery,
  peerWorkshopsQuery,
  portalConfigQuery,
  profilesQuery,
  reservationsQuery,
  rewardRedemptionsQuery,
  roomsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";

export function AdminActionLog({ maxItems = 30 }: { maxItems?: number }) {
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");

  const { data: storedLogs = [] } = useQuery(adminActionLogQuery);
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: reservations = [] } = useQuery(reservationsQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: redemptions = [] } = useQuery(rewardRedemptionsQuery());
  const { data: leaderReqs = [] } = useQuery(leaderRequestsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: staffCalls = [] } = useQuery(staffCallsQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const { data: portalConfig } = useQuery(portalConfigQuery);

  const semesterLabel = portalConfig?.semesterLabel ?? CURRENT_SEMESTER_LABEL;

  const entityName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "Entidade";
  const roomName = (id?: string | null) =>
    id ? (rooms.find((r) => r.id === id)?.nome ?? "Sala do Ágora") : "Sala do Ágora";

  const combinedLogs = useMemo(() => {
    const derived: AdminActionLogEntry[] = [];

    for (const r of reservations) {
      if (r.status === "pending") continue;
      derived.push({
        id: `res-${r.id}-${r.status}`,
        createdAt: r.created_at,
        action: r.status === "approved" ? "approved" : "rejected",
        category: "Reserva de Sala",
        item: `${roomName(r.room_id)} — ${r.motivo}`,
        entityLabel: entityName(r.entity_id),
        justification:
          r.status === "rejected"
            ? (r.admin_note ?? "Recusado pela administração.")
            : (r.admin_note ?? "Reserva de sala aprovada pela administração."),
      });
    }

    for (const w of workshops) {
      if (w.status === "pending") continue;
      const count = Math.max(1, countParticipants(w.ministrantes));
      const isJoint = Boolean(w.em_conjunto && w.partner_entity_id);
      const coins = calcWorkshopCoins(count, isJoint);
      derived.push({
        id: `wk-${w.id}-${w.status}-${w.moedas_liberadas ? "lc" : "pub"}`,
        createdAt: w.created_at,
        action: w.status === "approved" ? "approved" : "rejected",
        category: "Oficina de Equipe",
        item: `Oficina: ${w.titulo}`,
        entityLabel: entityName(w.entity_id),
        coinsLabel: w.moedas_liberadas ? `+${coins} LC` : undefined,
        justification:
          w.status === "rejected"
            ? (w.admin_note ?? "Oficina recusada pela administração.")
            : w.moedas_liberadas
              ? `Oficina validada e +${coins} LigaCoins liberadas.`
              : "Oficina aprovada e publicada para as equipes.",
      });
    }

    for (const red of redemptions) {
      if (red.status === "pending") continue;
      derived.push({
        id: `red-${red.id}-${red.status}`,
        createdAt: red.created_at,
        action: red.status === "approved" ? "approved" : "rejected",
        category: "Benefício LigaCoins",
        item: `Resgate: ${red.recompensa_titulo}`,
        entityLabel: entityName(red.entity_id),
        coinsLabel: `-${red.custo} LC`,
        justification:
          red.status === "rejected"
            ? (red.admin_note ?? "Solicitação recusada e LigaCoins estornadas.")
            : (red.admin_note ?? "Resgate de benefício aprovado."),
      });
    }

    for (const req of leaderReqs) {
      if (req.status === "pending") continue;
      derived.push({
        id: `ldr-${req.id}-${req.status}`,
        createdAt: req.created_at,
        action: req.status === "approved" ? "approved" : "rejected",
        category: "Cadastro de Líder",
        item: `Novo Projeto: ${req.projeto} (${req.faculdade})`,
        entityLabel: `${req.nome_lider} (${req.email})`,
        justification:
          req.status === "rejected"
            ? (req.admin_note ?? "Cadastro recusado pela administração.")
            : "Cadastro aprovado e acesso liberado.",
      });
    }

    for (const a of attendances) {
      if (!a.presente || !a.moedas_liberadas) continue;
      const m = meetings.find((x) => x.id === a.meeting_id);
      const count = Math.max(1, countParticipants(a.representantes));
      const coins = calcMeetingCoins(count);
      derived.push({
        id: `mt-${a.id}`,
        createdAt: a.created_at,
        action: "approved",
        category: "Reunião Liga UNI",
        item: m?.titulo ?? "Reunião Liga UNI",
        entityLabel: entityName(a.entity_id),
        coinsLabel: `+${coins} LC`,
        justification: `Presença validada (${count} representante${count > 1 ? "s" : ""}: ${a.representantes}).`,
      });
    }

    for (const r of trainingRegs) {
      if (!r.moedas_liberadas) continue;
      const t = trainings.find((x) => x.id === r.training_id);
      const count = Math.max(1, countParticipants(r.participantes));
      const coins = calcTrainingCoins(count);
      derived.push({
        id: `tr-${r.id}`,
        createdAt: r.created_at,
        action: "approved",
        category: "Capacitação UNI",
        item: t?.titulo ?? "Capacitação UNI",
        entityLabel: entityName(r.entity_id),
        coinsLabel: `+${coins} LC`,
        justification: `Participação validada (${count} membro${count > 1 ? "s" : ""}: ${r.participantes}).`,
      });
    }

    for (const v of staffVols) {
      if (!v.moedas_liberadas) continue;
      const c = staffCalls.find((x) => x.id === v.call_id);
      const count = Math.max(1, countParticipants(v.participantes));
      const coins = calcStaffCoins(count);
      derived.push({
        id: `st-${v.id}`,
        createdAt: v.created_at,
        action: "approved",
        category: "Staff em Evento",
        item: c?.evento ?? "Evento Ágora",
        entityLabel: entityName(v.entity_id),
        coinsLabel: `+${coins} LC`,
        justification: `Auxílio de Staff validado (${count} voluntário${count > 1 ? "s" : ""}: ${v.participantes}).`,
      });
    }

    // Mescla logs gravados em tempo real na sessão com o histórico das decisões já avaliadas
    const seenKeys = new Set<string>();
    const all: AdminActionLogEntry[] = [];

    for (const entry of [...storedLogs, ...derived]) {
      const dedupeKey = `${entry.action}|${entry.category}|${entry.item}|${entry.entityLabel}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      all.push(entry);
    }

    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [
    storedLogs,
    reservations,
    workshops,
    redemptions,
    leaderReqs,
    attendances,
    meetings,
    trainingRegs,
    trainings,
    staffVols,
    staffCalls,
    entities,
    rooms,
  ]);

  const filteredLogs = useMemo(() => {
    const base =
      filter === "all" ? combinedLogs : combinedLogs.filter((l) => l.action === filter);
    return base.slice(0, maxItems);
  }, [combinedLogs, filter, maxItems]);

  const approvedCount = combinedLogs.filter((l) => l.action === "approved").length;
  const rejectedCount = combinedLogs.filter((l) => l.action === "rejected").length;

  const handleExportLogsCsv = () => {
    const source =
      filter === "all" ? combinedLogs : combinedLogs.filter((l) => l.action === filter);
    const rows: (string | number | null | undefined)[][] = [
      [
        "Data/Hora",
        "Ação",
        "Categoria",
        "Item Avaliado",
        "Equipe / Solicitante",
        "LigaCoins",
        "Justificativa / Detalhe",
      ],
      ...source.map((l) => [
        fmtDateTime(l.createdAt),
        l.action === "approved" ? "Aprovado" : "Recusado",
        l.category,
        l.item,
        l.entityLabel,
        l.coinsLabel ?? "-",
        l.justification ?? "Aprovado sem observações adicionais.",
      ]),
    ];
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`auditoria_logs_admin_${dateStamp}.csv`, rows);
    toast.success(`Arquivo CSV com ${source.length} registro(s) de log exportado para auditoria!`);
  };

  const handleExportAuditCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);

    const teamRows = entities.map((entity) => {
      const reqs = calculateSemesterRequirements({
        entityId: entity.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      });
      const leaderProfile = profiles.find((p) => p.id === entity.leader_id);
      const fallbackMember = members.find((m) => m.entity_id === entity.id);
      const leaderName = leaderProfile?.nome ?? fallbackMember?.nome ?? `Líder — ${entity.nome}`;
      const leaderEmail = leaderProfile?.email ?? fallbackMember?.email ?? "lider@projeto.ufsc.br";

      const rMeeting = reqs.items.find((i) => i.key === "reunioes");
      const rStaff = reqs.items.find((i) => i.key === "staff");
      const rTrain = reqs.items.find((i) => i.key === "capacitacoes");
      const rWork = reqs.items.find((i) => i.key === "oficinas");

      const pendingSummary =
        reqs.items
          .filter((i) => !i.fulfilled)
          .map((i) => `${i.title} (${i.current}/${i.target})`)
          .join(" | ") || "Nenhuma pendência (100% em dia)";

      return [
        semesterLabel,
        entity.nome,
        entity.categoria,
        leaderName,
        leaderEmail,
        reqs.isCompliant ? "EM DIA" : "COM PENDÊNCIAS",
        reqs.missingRequirementsCount,
        `${reqs.fulfilledCount}/${reqs.totalRequirements}`,
        rMeeting ? `${rMeeting.current}/${rMeeting.target}` : "-",
        rStaff ? `${rStaff.current}/${rStaff.target}` : "-",
        rTrain ? `${rTrain.current}/${rTrain.target}` : "-",
        rWork ? `${rWork.current}/${rWork.target}` : "-",
        pendingSummary,
      ];
    });

    const rows: (string | number | null | undefined)[][] = [
      ["=== AUDITORIA LIGA UNI — 1. PENDÊNCIAS ATUAIS DAS EQUIPES ==="],
      [
        "Semestre",
        "Equipe",
        "Categoria",
        "Líder Responsável",
        "E-mail do Líder",
        "Status Semestral",
        "Qtd. Pendências",
        "Metas Cumpridas",
        "Reuniões Liga UNI",
        "Staff em Eventos",
        "Capacitações UNI",
        "Oficinas Oferecidas",
        "Detalhamento das Pendências",
      ],
      ...teamRows,
      [],
      ["=== AUDITORIA LIGA UNI — 2. LOG DE AÇÕES DO ADMINISTRADOR (APROVAÇÕES & RECUSAS) ==="],
      [
        "Data/Hora",
        "Ação",
        "Categoria",
        "Item Avaliado",
        "Equipe / Solicitante",
        "LigaCoins",
        "Justificativa / Detalhe",
      ],
      ...combinedLogs.map((l) => [
        fmtDateTime(l.createdAt),
        l.action === "approved" ? "Aprovado" : "Recusado",
        l.category,
        l.item,
        l.entityLabel,
        l.coinsLabel ?? "-",
        l.justification ?? "Aprovado sem observações adicionais.",
      ]),
    ];

    downloadCsvFile(`auditoria_completa_liga_uni_${dateStamp}.csv`, rows);
    toast.success(
      "Relatório CSV de auditoria (pendências das equipes + logs de ações) exportado com sucesso!",
    );
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">
              Log de Ações do Administrador (Aprovações & Recusas)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Registro cronológico das aprovações e recusas realizadas com data, item avaliado,
              justificativa fornecida e exportação CSV para auditoria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={handleExportLogsCsv}
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Exportar Logs (CSV)
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={handleExportAuditCsv}
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Exportar Auditoria Completa (CSV)
          </Button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas ({combinedLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              filter === "approved"
                ? "bg-success text-white"
                : "bg-success/10 text-success hover:bg-success/20"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Aprovadas ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("rejected")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              filter === "rejected"
                ? "bg-destructive text-destructive-foreground"
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            }`}
          >
            <XCircle className="h-3 w-3" /> Recusadas ({rejectedCount})
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
          Nenhuma ação registrada para este filtro.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto rounded-lg border divide-y divide-border/60 bg-background/50">
          {filteredLogs.map((log) => {
            const isApproved = log.action === "approved";
            return (
              <div
                key={log.id}
                className="flex flex-col gap-1.5 px-3.5 py-2.5 text-xs transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isApproved
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Aprovado
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Recusado
                        </>
                      )}
                    </span>

                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {log.category}
                    </span>

                    <span className="font-semibold text-foreground">{log.item}</span>

                    <span className="text-muted-foreground">· {log.entityLabel}</span>

                    {log.coinsLabel && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {log.coinsLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <FileText className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/80" />
                    <span>
                      <strong className="font-medium text-foreground">Justificativa / Detalhe:</strong>{" "}
                      <span className={!isApproved ? "text-destructive font-medium" : ""}>
                        {log.justification || "Aprovado sem observações adicionais."}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{fmtDateTime(log.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
