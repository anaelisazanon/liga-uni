import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  head: () => ({ meta: [{ title: "Minha equipe — Liga UNI" }] }),
  component: EquipePage,
});

function EquipePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  useEffect(() => {
    if (entity) {
      setNome(entity.nome);
      setDescricao(entity.descricao);
    }
  }, [entity]);

  const saveEntity = useMutation({
    mutationFn: async () => {
      const { error } = entity
        ? await supabase.from("entities").update({ nome, descricao }).eq("id", entity.id)
        : await supabase.from("entities").insert({ nome, descricao, leader_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entidade salva");
      qc.invalidateQueries({ queryKey: ["my-entity"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return null;

  return (
    <>
      <PageHeader title="Minha equipe" description="Dados da entidade e membros" />
      <Card className="max-w-2xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveEntity.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome da entidade</Label>
            <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <Button disabled={saveEntity.isPending}>
            {entity ? "Salvar alterações" : "Cadastrar entidade"}
          </Button>
        </form>
      </Card>
      {entity && <Members entityId={entity.id} />}
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Membros ({data.length})</h2>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirm("Remover membro?") && del.mutate(m.id)}
                  >
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
