import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminMessagesQuery, CHAMADO_TOPICOS, entitiesQuery } from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/chamados")({
  head: () => ({ meta: [{ title: "Chamados dos Líderes — Liga UNI" }] }),
  component: AdminChamadosPage,
});

function AdminChamadosPage() {
  const qc = useQueryClient();
  const { data: msgs = [] } = useQuery(adminMessagesQuery());
  const { data: entities = [] } = useQuery(entitiesQuery);
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "answered">("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const entityName = (id: string) => entities.find((e) => e.id === id)?.nome ?? "Entidade";

  const answerMsg = useMutation({
    mutationFn: async ({ id, resposta }: { id: string; resposta: string }) => {
      const { error } = await supabase
        .from("admin_messages")
        .update({ resposta, status: "answered" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("Resposta enviada ao líder!");
      setReplyText((prev) => ({ ...prev, [vars.id]: "" }));
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (err) => toast.error(errMsg(err)),
  });

  const filtered = msgs.filter((m) => {
    if (topicFilter !== "all" && (m.topico || "Outros Assuntos") !== topicFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Chamados dos Líderes"
        description="Gerencie e responda as dúvidas enviadas pelos líderes das entidades, categorizadas por tópico"
      />

      {/* Filtros por Tópico e Status */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tópico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tópicos ({msgs.length})</SelectItem>
              {CHAMADO_TOPICOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1.5 rounded-lg border bg-card p-1">
          {(
            [
              { k: "all", label: "Todos" },
              { k: "pending", label: "Pendentes" },
              { k: "answered", label: "Respondidos" },
            ] as const
          ).map((s) => (
            <button
              key={s.k}
              type="button"
              onClick={() => setStatusFilter(s.k)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                statusFilter === s.k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          Nenhum chamado encontrado para o filtro selecionado.
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => (
            <Card key={msg.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {msg.topico || "Geral"}
                    </span>
                    <h3 className="font-semibold text-base text-foreground">{msg.assunto}</h3>
                  </div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">
                    Enviado por <b className="text-foreground">{entityName(msg.entity_id)}</b> ·{" "}
                    {fmtDateTime(msg.created_at)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    msg.status === "answered"
                      ? "bg-success/15 text-success"
                      : "bg-warning/20 text-warning-foreground"
                  }`}
                >
                  {msg.status === "answered" ? "Respondido" : "Aguardando resposta"}
                </span>
              </div>

              <div className="rounded-lg bg-muted/30 p-3 text-sm text-foreground">
                {msg.mensagem}
              </div>

              {msg.resposta ? (
                <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div>
                    <b>Resposta enviada pelo Admin:</b> {msg.resposta}
                  </div>
                </div>
              ) : (
                <form
                  className="flex gap-2 pt-1"
                  onSubmit={(evForm) => {
                    evForm.preventDefault();
                    const text = (replyText[msg.id] ?? "").trim();
                    if (!text) return;
                    answerMsg.mutate({ id: msg.id, resposta: text });
                  }}
                >
                  <Input
                    placeholder="Digite a resposta para o líder..."
                    value={replyText[msg.id] ?? ""}
                    onChange={(evInput) =>
                      setReplyText((prev) => ({ ...prev, [msg.id]: evInput.target.value }))
                    }
                  />
                  <Button type="submit" size="sm" disabled={answerMsg.isPending}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Responder
                  </Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
