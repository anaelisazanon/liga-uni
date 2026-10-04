import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { membersQuery, myEntityQuery, type Member } from "@/lib/data";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/equipe")({
  head: () => ({ meta: [{ title: "Configurações do Projeto & Membros — Liga UNI" }] }),
  component: EquipePage,
});

function EquipePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const [descricao, setDescricao] = useState("");
  const [avisosEmail, setAvisosEmail] = useState(true);

  useEffect(() => {
    if (entity) {
      setDescricao(entity.descricao);
      setAvisosEmail(entity.avisos_email ?? true);
    }
  }, [entity]);

  const saveEntity = useMutation({
    mutationFn: async () => {
      if (!entity) return;
      const { error } = await supabase
        .from("entities")
        .update({ descricao, avisos_email: avisosEmail })
        .eq("id", entity.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações do projeto salvas!");
      qc.invalidateQueries({ queryKey: ["my-entity"] });
      qc.invalidateQueries({ queryKey: ["entities"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggleEmailNotice = useMutation({
    mutationFn: async (nextValue: boolean) => {
      if (!entity) return nextValue;
      setAvisosEmail(nextValue);
      const { error } = await supabase
        .from("entities")
        .update({ avisos_email: nextValue })
        .eq("id", entity.id);
      if (error) throw error;
      return nextValue;
    },
    onSuccess: (nextValue) => {
      toast.success(
        nextValue
          ? "Recebimento de avisos por e-mail ativado!"
          : "Recebimento de avisos por e-mail desativado.",
      );
      qc.invalidateQueries({ queryKey: ["my-entity"] });
      qc.invalidateQueries({ queryKey: ["entities"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  return (
    <>
      <PageHeader
        title={entity.nome}
        description="Gerencie a descrição institucional, preferências de avisos por e-mail e a lista de membros da equipe"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveEntity.mutate();
            }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Nome do projeto / entidade</Label>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Definido no cadastro (não editável)
                </span>
              </div>
              <Input
                value={entity.nome}
                disabled
                className="bg-muted/60 font-semibold opacity-90"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição do projeto</Label>
              <Textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva os objetivos, missão e contatos do seu projeto..."
              />
            </div>
            <Button disabled={saveEntity.isPending}>Salvar descrição</Button>
          </form>
        </Card>

        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Notificações e Avisos por E-mail</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure o envio automático de alertas para o líder do projeto
                  </p>
                </div>
              </div>
              <Switch
                checked={avisosEmail}
                onCheckedChange={(v) => toggleEmailNotice.mutate(v)}
                disabled={toggleEmailNotice.isPending}
              />
            </div>

            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-xs transition ${
                avisosEmail
                  ? "border-primary/25 bg-primary/5 text-muted-foreground"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  avisosEmail ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Mail className="h-4 w-4" />
              </div>
              <span className="leading-relaxed">
                <b className="text-foreground">
                  {avisosEmail ? "Avisos por e-mail ativados:" : "Avisos por e-mail desativados:"}
                </b>{" "}
                Sempre que o administrador convocar uma nova <b>Reunião Liga UNI</b>, publicar uma{" "}
                <b>Capacitação UNI</b> ou outra equipe oferecer uma <b>Oficina</b>, você recebe um
                aviso diretamente no seu e-mail cadastrado ({user.email}).
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>E-mail vinculado: {user.email}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-semibold ${
                avisosEmail
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {avisosEmail ? "Ativado" : "Desativado"}
            </span>
          </div>
        </Card>
      </div>

      <Members entityId={entity.id} />
    </>
  );
}

function Members({ entityId }: { entityId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(membersQuery(entityId));
  const [editing, setEditing] = useState<Partial<Member> | null>(null);

  const save = useMutation({
    mutationFn: async (m: Partial<Member>) => {
      const payload = {
        nome: m.nome ?? "",
        email: m.email ?? "",
        curso: m.curso ?? "",
        entity_id: entityId,
      };
      const { error } = m.id
        ? await supabase.from("members").update(payload).eq("id", m.id)
        : await supabase.from("members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      toast.success("Membro salvo");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Membros da equipe ({data.length})</h2>
        <Button onClick={() => setEditing({})}>
          <Plus /> Novo membro
        </Button>
      </div>
      <div className="rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum membro cadastrado.
                </TableCell>
              </TableRow>
            )}
            {data.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.curso}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(m)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar membro" : "Novo membro"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              {(["nome", "email", "curso"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="capitalize">{k === "email" ? "E-mail" : k}</Label>
                  <Input
                    required={k !== "email"}
                    type={k === "email" ? "email" : "text"}
                    value={editing[k] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                  />
                </div>
              ))}
              <Button className="w-full" disabled={save.isPending}>
                Salvar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
