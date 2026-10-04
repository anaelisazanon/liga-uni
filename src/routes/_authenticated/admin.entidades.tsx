import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Check, UserPlus, X } from "lucide-react";
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
  entitiesQuery,
  leaderRequestsQuery,
  membersQuery,
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
        title="Entidades"
        description={`${entities.length} entidades ativas · ${members.length} membros · ${pendingReqCount} cadastro(s) pendente(s)`}
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

function EntidadesSubTab() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const [q, setQ] = useState("");
  const [inst, setInst] = useState<"all" | "ufsc" | "udesc">("all");
  const term = q.toLowerCase();

  const matchesInst = (nome: string, descricao: string) => {
    if (inst === "all") return true;
    const text = (nome + " " + descricao).toLowerCase();
    return inst === "ufsc" ? text.includes("ufsc") : text.includes("udesc");
  };

  const filtered = entities.filter(
    (e) =>
      matchesInst(e.nome, e.descricao) &&
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
        <Tabs value={inst} onValueChange={(v) => setInst(v as "all" | "ufsc" | "udesc")}>
          <TabsList>
            <TabsTrigger value="all">Todas ({entities.length})</TabsTrigger>
            <TabsTrigger value="ufsc">UFSC Joinville</TabsTrigger>
            <TabsTrigger value="udesc">UDESC Joinville</TabsTrigger>
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
          return (
            <AccordionItem
              key={e.id}
              value={e.id}
              className="rounded-xl border bg-card px-5 shadow-card"
            >
              <AccordionTrigger>
                <div className="text-left">
                  <div className="font-semibold">{e.nome}</div>
                  <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {ms.length} {ms.length === 1 ? "membro" : "membros"} ·{" "}
                    {e.descricao || "Sem descrição"}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {e.descricao && (
                  <p className="mb-3 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    {e.descricao}
                  </p>
                )}
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
