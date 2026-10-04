import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
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
import {
  entitiesQuery,
  profilesQuery,
  reservationsQuery,
  roomsQuery,
  type Reservation,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/reservas")({
  head: () => ({ meta: [{ title: "Solicitações de reserva — Liga UNI" }] }),
  component: AdminReservas,
});

function AdminReservas() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [decision, setDecision] = useState<{
    res: Reservation;
    status: "approved" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");

  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);

  const respond = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: "approved" | "rejected";
      adminNote: string | null;
    }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status, admin_note: adminNote || null })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      setDecision(null);
      setNote("");
      toast.success(s === "approved" ? "Reserva aprovada" : "Reserva recusada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["room-busy"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const hasApprovedConflict = (r: Reservation) => {
    if (r.status !== "pending") return false;
    const start = new Date(r.inicio);
    const end = new Date(r.fim);
    return res.some(
      (other) =>
        other.id !== r.id &&
        other.room_id === r.room_id &&
        other.status === "approved" &&
        new Date(other.inicio) < end &&
        new Date(other.fim) > start,
    );
  };

  const list = res.filter((r) => tab === "all" || r.status === tab);

  return (
    <>
      <PageHeader
        title="Solicitações de reserva"
        description="Aprove ou recuse pedidos dos líderes"
      />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Recusadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade / Solicitante</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Motivo / Observação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nada por aqui.
                </TableCell>
              </TableRow>
            )}
            {list.map((r) => {
              const ent = entities.find((e) => e.id === r.entity_id);
              const requester = profiles.find((p) => p.id === r.requested_by);
              const conflict = hasApprovedConflict(r);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{ent?.nome ?? "—"}</div>
                    {requester && (
                      <div className="text-xs text-muted-foreground">
                        {requester.nome || "Líder"} · {requester.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{rooms.find((x) => x.id === r.room_id)?.nome ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {fmtDateTime(r.inicio)}
                    <br />
                    {fmtDateTime(r.fim)}
                    {conflict && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" /> Conflito com reserva aprovada
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">
                    <div>{r.motivo}</div>
                    {r.admin_note && (
                      <div className="mt-1 text-xs italic text-muted-foreground">
                        Obs: {r.admin_note}
                      </div>
                    )}
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
                            setDecision({ res: r, status: "approved" });
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
                            setDecision({ res: r, status: "rejected" });
                          }}
                        >
                          <X /> Recusar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.status === "approved"
                ? "Aprovar solicitação de reserva"
                : "Recusar solicitação de reserva"}
            </DialogTitle>
          </DialogHeader>
          {decision && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                respond.mutate({
                  id: decision.res.id,
                  status: decision.status,
                  adminNote: note.trim() || null,
                });
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-medium">
                  {rooms.find((x) => x.id === decision.res.room_id)?.nome}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fmtDateTime(decision.res.inicio)} até {fmtDateTime(decision.res.fim)}
                </div>
                <div className="mt-1 text-xs">{decision.res.motivo}</div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {decision.status === "rejected"
                    ? "Motivo da recusa / observação"
                    : "Observação para o líder (opcional)"}
                </Label>
                <Textarea
                  required={decision.status === "rejected"}
                  placeholder={
                    decision.status === "rejected"
                      ? "Informe o motivo da recusa..."
                      : "Ex.: Chaves na recepção do Ágora."
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
                  {decision.status === "approved" ? "Confirmar aprovação" : "Confirmar recusa"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
