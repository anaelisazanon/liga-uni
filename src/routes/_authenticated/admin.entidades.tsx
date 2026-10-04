import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Building2, Check, CheckCircle2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateSemesterRequirements,
  CURRENT_SEMESTER_LABEL,
  entitiesQuery,
  generalMeetingsQuery,
  leaderRequestsQuery,
  meetingAttendancesQuery,
  membersQuery,
  peerWorkshopsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  type LeaderRequest,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/entidades")({
  head: () => ({ meta: [{ title: "Entidades e Cadastros — Liga UNI" }] }),
  component: EntidadesPage,
});

function EntidadesPage() {
  const [section, setSection] = useState<"entidades" | "cadastros">("entidades");
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const { data: requests = [] } = useQuery(leaderRequestsQuery);

  const pendingReqCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Entidades Universitárias de Joinville"
        description={`${entities.length} entidades na Liga UNI (UDESC, UFSC, IFSC e Univille) · ${members.length} membros · Cadastros pendentes: ${pendingReqCount}`}
      />

      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as "entidades" | "cadastros")}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entidades" className="gap-2">
            <Building2 className="h-4 w-4" />
            Entidades ({entities.length})
          </TabsTrigger>
          <TabsTrigger value="cadastros" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Cadastros
            {pendingReqCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {pendingReqCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entidades">
          <EntidadesSubTab />
        </TabsContent>

        <TabsContent value="cadastros">
          <CadastrosSubTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

type InstFilter = "all" | "udesc" | "ufsc" | "ifsc" | "univille" | "pendentes";

function EntidadesSubTab() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());

  const [q, setQ] = useState("");
  const [inst, setInst] = useState<InstFilter>("all");
  const term = q.toLowerCase();

  const getSemReqs = (entityId: string) =>
    calculateSemesterRequirements({
      entityId,
      generalMeetings: meetings,
      meetingAttendances: attendances,
      staffVolunteers: staffVols,
      trainingRegistrations: trainingRegs,
      peerWorkshops: workshops,
    });

  const nonCompliantCount = entities.filter((e) => !getSemReqs(e.id).isCompliant).length;

  const matchesInst = (entityId: string, nome: string, descricao: string) => {
    if (inst === "all") return true;
    if (inst === "pendentes") return !getSemReqs(entityId).isCompliant;
    const text = (nome + " " + descricao).toLowerCase();
    return text.includes(inst);
  };

  const filtered = entities.filter(
    (e) =>
      matchesInst(e.id, e.nome, e.descricao) &&
      (e.nome.toLowerCase().includes(term) ||
        e.descricao.toLowerCase().includes(term) ||
        members.some(
          (m) =>
            m.entity_id === e.id &&
            (m.nome + " " + m.curso + " " + m.email).toLowerCase().includes(term),
        )),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={inst} onValueChange={(v) => setInst(v as InstFilter)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todas ({entities.length})</TabsTrigger>
            <TabsTrigger value="udesc">UDESC Joinville</TabsTrigger>
            <TabsTrigger value="ufsc">UFSC Joinville</TabsTrigger>
            <TabsTrigger value="ifsc">IFSC Joinville</TabsTrigger>
            <TabsTrigger value="univille">Univille</TabsTrigger>
            <TabsTrigger value="pendentes" className="text-destructive font-semibold">
              ! Exigências Pendentes ({nonCompliantCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Buscar entidade, membro ou curso..."
          className="w-full sm:w-80"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">Nenhuma entidade encontrada.</p>
      )}

      <Accordion type="multiple" className="space-y-3">
        {filtered.map((e) => {
          const ms = members.filter((m) => m.entity_id === e.id);
          const sem = getSemReqs(e.id);
          return (
            <AccordionItem
              key={e.id}
              value={e.id}
              className={
                sem.isCompliant
                  ? "rounded-xl border bg-card px-5 shadow-card"
                  : "rounded-xl border-2 border-destructive/40 bg-card px-5 shadow-card"
              }
            >
              <AccordionTrigger>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3 pr-3 text-left">
                  <div>
                    <div className="font-semibold flex flex-wrap items-center gap-2">
                      <span>{e.nome}</span>
                    </div>
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {ms.length} {ms.length === 1 ? "membro" : "membros"} ·{" "}
                      {e.descricao || "Sem descrição"}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {sem.isCompliant ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {sem.fulfilledCount}/
                        {sem.totalRequirements} exigências ({CURRENT_SEMESTER_LABEL})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> ! {sem.fulfilledCount}/
                        {sem.totalRequirements} exigências semestrais cumpridas
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {e.descricao && (
                  <p className="mb-3 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    {e.descricao}
                  </p>
                )}

                {/* Resumo das exigências semestrais da entidade */}
                <div
                  className={
                    sem.isCompliant
                      ? "mb-4 rounded-xl border border-success/30 bg-success/5 p-3.5"
                      : "mb-4 rounded-xl border border-destructive/35 bg-destructive/5 p-3.5"
                  }
                >
                  <div className="text-xs font-bold text-foreground mb-2">
                    Status de Permanência no Semestre {sem.semesterLabel} (renova todo semestre):
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {sem.items.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-lg border border-border bg-card p-2.5 text-xs"
                      >
                        <div className="font-semibold text-foreground">{item.shortTitle}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          Realizado: <strong>{item.current}</strong> / {item.target}
                        </div>
                        <div
                          className={
                            item.fulfilled
                              ? "mt-1 text-[11px] font-bold text-success"
                              : "mt-1 text-[11px] font-bold text-destructive"
                          }
                        >
                          {item.fulfilled ? "✓ Cumprida" : `• ${item.statusText}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Curso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          Sem membros.
                        </TableCell>
                      </TableRow>
                    )}
                    {ms.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>{m.curso}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function CadastrosSubTab() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [decision, setDecision] = useState<{
    req: LeaderRequest;
    status: "approved" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");

  const { data: requests = [] } = useQuery(leaderRequestsQuery);

  const respond = useMutation({
    mutationFn: async ({
      req,
      status,
      adminNote,
    }: {
      req: LeaderRequest;
      status: "approved" | "rejected";
      adminNote: string | null;
    }) => {
      const { error } = await supabase
        .from("leader_requests")
        .update({ status, admin_note: adminNote || null })
        .eq("id", req.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      setDecision(null);
      setNote("");
      toast.success(
        s === "approved"
          ? "Cadastro aprovado! O projeto foi criado e o líder já pode fazer login."
          : "Cadastro recusado.",
      );
      qc.invalidateQueries({ queryKey: ["leader-requests"] });
      qc.invalidateQueries({ queryKey: ["entities"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const list = requests.filter((r) => tab === "all" || r.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Analise e aprove novos líderes e projetos universitários para liberar o login no sistema.
        </p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Recusados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Líder</TableHead>
              <TableHead>Faculdade</TableHead>
              <TableHead>Projeto / Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma solicitação encontrada.
                </TableCell>
              </TableRow>
            )}
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.nome_lider}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </TableCell>
                <TableCell className="font-medium">{r.faculdade}</TableCell>
                <TableCell className="font-semibold text-primary">{r.projeto}</TableCell>
                <TableCell className="max-w-xs text-xs text-muted-foreground">
                  <div>{r.descricao}</div>
                  {r.admin_note && (
                    <div className="mt-1 italic text-foreground">Obs: {r.admin_note}</div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {fmtDateTime(r.created_at)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {r.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNote("");
                          setDecision({ req: r, status: "approved" });
                        }}
                      >
                        <Check /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-1"
                        onClick={() => {
                          setNote("");
                          setDecision({ req: r, status: "rejected" });
                        }}
                      >
                        <X /> Recusar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.status === "approved"
                ? "Aprovar cadastro de líder e projeto"
                : "Recusar solicitação de cadastro"}
            </DialogTitle>
          </DialogHeader>
          {decision && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                respond.mutate({
                  req: decision.req,
                  status: decision.status,
                  adminNote: note.trim() || null,
                });
              }}
            >
              <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">
                  {decision.req.projeto} ({decision.req.faculdade})
                </div>
                <div className="text-xs text-muted-foreground">
                  Líder: <b>{decision.req.nome_lider}</b> · {decision.req.email}
                </div>
                <div className="mt-1.5 text-xs">{decision.req.descricao}</div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {decision.status === "rejected"
                    ? "Motivo da recusa"
                    : "Observação de boas-vindas (opcional)"}
                </Label>
                <Textarea
                  required={decision.status === "rejected"}
                  placeholder={
                    decision.status === "rejected"
                      ? "Informe o motivo da recusa..."
                      : "Ex.: Bem-vindo ao Liga UNI!"
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDecision(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant={decision.status === "rejected" ? "destructive" : "default"}
                  disabled={respond.isPending}
                >
                  {decision.status === "approved" ? "Aprovar e liberar login" : "Confirmar recusa"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
