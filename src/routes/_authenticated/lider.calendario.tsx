import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { MonthCalendar } from "@/components/MonthCalendar";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventsQuery, myEntityQuery } from "@/lib/data";
import { errMsg, toLocalInput } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/calendario")({
  head: () => ({ meta: [{ title: "Calendário da entidade — Liga UNI" }] }),
  component: CalendarioPage,
});

type Form = {
  id?: string;
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  local: string;
};
const empty = (): Form => ({ titulo: "", descricao: "", inicio: "", fim: "", local: "" });

function CalendarioPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const { data: events = [] } = useQuery({ ...eventsQuery(entity?.id), enabled: !!entity });
  const [form, setForm] = useState<Form | null>(null);

  const save = useMutation({
    mutationFn: async (f: Form) => {
      if (new Date(f.fim) <= new Date(f.inicio))
        throw new Error("O término deve ser após o início");
      const payload = {
        titulo: f.titulo,
        descricao: f.descricao,
        local: f.local,
        inicio: new Date(f.inicio).toISOString(),
        fim: new Date(f.fim).toISOString(),
        entity_id: entity!.id,
      };
      const { error } = f.id
        ? await supabase.from("events").update(payload).eq("id", f.id)
        : await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(null);
      toast.success("Evento salvo");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(null);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Eventos da sua entidade"
        action={
          <Button onClick={() => setForm(empty())}>
            <Plus /> Novo evento
          </Button>
        }
      />
      <MonthCalendar
        items={events.map((e) => ({
          id: e.id,
          title: e.titulo,
          start: e.inicio,
          end: e.fim,
          sub: e.local,
        }))}
        onItemClick={(id) => {
          const e = events.find((x) => x.id === id)!;
          setForm({
            id: e.id,
            titulo: e.titulo,
            descricao: e.descricao,
            local: e.local,
            inicio: toLocalInput(e.inicio),
            fim: toLocalInput(e.fim),
          });
        }}
      />
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar evento" : "Novo evento"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={form.inicio}
                    onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={form.fim}
                    onChange={(e) => setForm({ ...form, fim: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={save.isPending}>
                  Salvar
                </Button>
                {form.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => confirm("Excluir evento?") && del.mutate(form.id!)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
