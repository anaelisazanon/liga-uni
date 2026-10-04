import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Power, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reservationsQuery, roomsQuery, type Room } from "@/lib/data";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/salas")({
  head: () => ({ meta: [{ title: "Salas do Ágora — Liga UNI" }] }),
  component: SalasPage,
});

function SalasPage() {
  const qc = useQueryClient();
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: res = [] } = useQuery(reservationsQuery());
  const [edit, setEdit] = useState<Partial<Room> | null>(null);

  const save = useMutation({
    mutationFn: async (r: Partial<Room>) => {
      const payload = {
        nome: r.nome ?? "",
        capacidade: Number(r.capacidade) || 1,
        descricao: r.descricao ?? "",
        ativa: r.ativa ?? true,
      };
      const { error } = r.id
        ? await supabase.from("rooms").update(payload).eq("id", r.id)
        : await supabase.from("rooms").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setEdit(null);
      toast.success("Sala salva");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase.from("rooms").update({ ativa }).eq("id", id);
      if (error) throw error;
      return ativa;
    },
    onSuccess: (ativa) => {
      toast.success(ativa ? "Sala reativada" : "Sala desativada");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sala excluída");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const handleDeleteRoom = (room: Room) => {
    const now = new Date();
    const roomRes = res.filter((x) => x.room_id === room.id);
    const futureApproved = roomRes.filter((x) => x.status === "approved" && new Date(x.fim) > now);

    if (futureApproved.length > 0) {
      toast.error(
        `Não é possível excluir esta sala porque há ${futureApproved.length} reserva(s) futura(s) aprovada(s). Desative a sala se não quiser novos pedidos.`,
      );
      return;
    }

    const msg =
      roomRes.length > 0
        ? `Excluir permanentemente a sala "${room.nome}"? As ${roomRes.length} reserva(s) vinculada(s) (histórico/pendentes) também serão apagadas.`
        : `Excluir permanentemente a sala "${room.nome}"?`;

    if (confirm(msg)) {
      del.mutate(room.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Salas do Ágora"
        description="Cadastre, edite, desative ou remova salas"
        action={
          <Button onClick={() => setEdit({ ativa: true, capacidade: 20 })}>
            <Plus /> Nova sala
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.nome}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {r.capacidade} pessoas
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.ativa ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {r.ativa ? "Ativa" : "Inativa"}
              </span>
            </div>
            <p className="mt-3 min-h-10 text-sm text-muted-foreground">{r.descricao}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit(r)}>
                <Pencil /> Editar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleActive.mutate({ id: r.id, ativa: !r.ativa })}
              >
                <Power className="h-3.5 w-3.5" /> {r.ativa ? "Desativar" : "Ativar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Excluir permanentemente"
                onClick={() => handleDeleteRoom(r)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Editar sala" : "Nova sala"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(edit);
              }}
            >
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  required
                  value={edit.nome ?? ""}
                  onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={edit.capacidade ?? ""}
                  onChange={(e) => setEdit({ ...edit, capacidade: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={edit.descricao ?? ""}
                  onChange={(e) => setEdit({ ...edit, descricao: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={edit.ativa ?? true}
                  onCheckedChange={(v) => setEdit({ ...edit, ativa: v })}
                />
                <Label>Disponível para reserva</Label>
              </div>
              <Button className="w-full" disabled={save.isPending}>
                Salvar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
