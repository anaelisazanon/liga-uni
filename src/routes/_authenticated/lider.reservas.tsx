import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader, StatusBadge } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  eventsQuery,
  myEntityQuery,
  reservationsQuery,
  roomBusyQuery,
  roomsQuery,
} from "@/lib/data";
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

  const { fromIso, toIso } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 90 * 86400000);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }, []);

  const { data: busySlots = [] } = useQuery({
    ...roomBusyQuery(f.room_id, fromIso, toIso),
    enabled: !!f.room_id,
  });

  const dateErrors = useMemo(() => {
    const errs: { inicio?: string; fim?: string } = {};
    if (f.inicio) {
      const start = new Date(f.inicio);
      if (start <= new Date()) {
        errs.inicio = "O início deve ser no futuro.";
      }
    }
    if (f.inicio && f.fim) {
      const start = new Date(f.inicio);
      const end = new Date(f.fim);
      if (end <= start) {
        errs.fim = "O término deve ser após o início.";
      }
    }
    return errs;
  }, [f.inicio, f.fim]);

  const hasOverlap = useMemo(() => {
    if (!f.inicio || !f.fim) return false;
    const start = new Date(f.inicio);
    const end = new Date(f.fim);
    if (end <= start) return false;
    return busySlots.some((b) => new Date(b.inicio) < end && new Date(b.fim) > start);
  }, [f.inicio, f.fim, busySlots]);

  const create = useMutation({
    mutationFn: async () => {
      if (!f.room_id) throw new Error("Escolha uma sala");
      if (dateErrors.inicio) throw new Error(dateErrors.inicio);
      if (dateErrors.fim) throw new Error(dateErrors.fim);
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
      qc.invalidateQueries({ queryKey: ["room-busy"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação cancelada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.nome ?? "—";
  const eventTitle = (id: string | null) => (id ? events.find((e) => e.id === id)?.titulo : null);
  const activeRooms = rooms.filter((r) => r.ativa);

  return (
    <>
      <PageHeader title="Reservas do Ágora" description="Solicite salas e acompanhe o status" />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card>
          <h3 className="mb-4 font-semibold">Nova solicitação</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (dateErrors.inicio || dateErrors.fim) return;
              create.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>Sala</Label>
              <Select value={f.room_id} onValueChange={(v) => setF({ ...f, room_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome} · {r.capacidade} pessoas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {f.room_id && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <div className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Horários já reservados (aprovados)
                </div>
                {busySlots.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum horário ocupado nos próximos dias.</p>
                ) : (
                  <ul className="max-h-28 space-y-1 overflow-y-auto text-muted-foreground">
                    {busySlots.map((b, idx) => (
                      <li key={idx}>
                        {fmtDateTime(b.inicio)} até {fmtDateTime(b.fim)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Evento vinculado (opcional)</Label>
              <Select value={f.event_id} onValueChange={(v) => setF({ ...f, event_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  required
                  value={f.inicio}
                  onChange={(e) => setF({ ...f, inicio: e.target.value })}
                />
                {dateErrors.inicio && (
                  <p className="text-xs text-destructive">{dateErrors.inicio}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="datetime-local"
                  required
                  value={f.fim}
                  onChange={(e) => setF({ ...f, fim: e.target.value })}
                />
                {dateErrors.fim && <p className="text-xs text-destructive">{dateErrors.fim}</p>}
              </div>
            </div>

            {hasOverlap && (
              <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/15 p-3 text-xs text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Atenção: o horário escolhido conflita com uma reserva já aprovada nesta sala. Você
                  ainda pode enviar a solicitação para avaliação do administrador.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea
                required
                value={f.motivo}
                onChange={(e) => setF({ ...f, motivo: e.target.value })}
              />
            </div>
            <Button
              className="w-full"
              disabled={create.isPending || Boolean(dateErrors.inicio) || Boolean(dateErrors.fim)}
            >
              Solicitar reserva
            </Button>
          </form>
        </Card>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sala</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {res.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma solicitação ainda.
                  </TableCell>
                </TableRow>
              )}
              {res.map((r) => {
                const evName = eventTitle(r.event_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{roomName(r.room_id)}</div>
                      {evName && (
                        <div className="text-xs font-medium text-primary">Evento: {evName}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{r.motivo}</div>
                      {r.admin_note && (
                        <div className="mt-1 text-xs italic text-muted-foreground">
                          Observação do admin: {r.admin_note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fmtDateTime(r.inicio)}
                      <br />
                      {fmtDateTime(r.fim)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            confirm("Cancelar esta solicitação de reserva?") && cancel.mutate(r.id)
                          }
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
