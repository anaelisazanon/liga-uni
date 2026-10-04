import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { leaderRequestsQuery, type LeaderRequest } from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/cadastros")({
  head: () => ({ meta: [{ title: "Cadastros de Líderes — Liga UNI" }] }),
  component: AdminCadastros,
});

function AdminCadastros() {
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
    <>
      <PageHeader
        title="Solicitações de cadastro"
        description="Analise e aprove novos líderes e projetos universitários para liberar o acesso ao sistema"
      />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Recusados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>
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
    </>
  );
}
