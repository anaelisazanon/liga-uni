import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eventsQuery, myEntityQuery, reservationsQuery, roomsQuery } from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/lider/reservas")({
  head: () => ({ meta: [{ title: "Reservas do Ágora — Liga UNI" }] }),
  component: ReservasPage,
});

function ReservasPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: events = [] } = useQuery({ ...eventsQuery(entity?.id), enabled: !!entity });
  const { data: res = [] } = useQuery({ ...reservationsQuery(entity?.id), enabled: !!entity });
  const [f, setF] = useState({ room_id: "", event_id: "none", inicio: "", fim: "", motivo: "" });

  const create = useMutation({
    mutationFn: async () => {
      if (!f.room_id) throw new Error("Escolha uma sala");
      const { error } = await supabase.from("reservations").insert({
        room_id: f.room_id,
        event_id: f.event_id === "none" ? null : f.event_id,
        entity_id: entity!.id,
        requested_by: user.id,
        inicio: new Date(f.inicio).toISOString(),
        fim: new Date(f.fim).toISOString(),
        motivo: f.motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada");
      setF({ room_id: "", event_id: "none", inicio: "", fim: "", motivo: "" });
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.nome ?? "—";
  const activeRooms = rooms.filter((r) => r.ativa);

  return (
    <>
      <PageHeader title="Reservas do Ágora" description="Solicite salas e acompanhe o status" />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <h3 className="mb-4 font-semibold">Nova solicitação</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
            <div className="space-y-1.5">
              <Label>Sala</Label>
              <Select value={f.room_id} onValueChange={(v) => setF({ ...f, room_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome} · {r.capacidade} pessoas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Evento vinculado (opcional)</Label>
              <Select value={f.event_id} onValueChange={(v) => setF({ ...f, event_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.titulo}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Início</Label><Input type="datetime-local" required value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Fim</Label><Input type="datetime-local" required value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Motivo</Label><Textarea required value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} /></div>
            <Button className="w-full" disabled={create.isPending}>Solicitar reserva</Button>
          </form>
        </Card>
        <div className="rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sala</TableHead><TableHead>Período</TableHead><TableHead>Status</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {res.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma solicitação ainda.</TableCell></TableRow>
              )}
              {res.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{roomName(r.room_id)}</div>
                    <div className="text-xs text-muted-foreground">{r.motivo}</div>
                    {r.admin_note && <div className="text-xs italic text-muted-foreground">Admin: {r.admin_note}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{fmtDateTime(r.inicio)}<br />{fmtDateTime(r.fim)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel.mutate(r.id)}>Cancelar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
