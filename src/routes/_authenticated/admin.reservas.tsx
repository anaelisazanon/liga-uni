import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { entitiesQuery, reservationsQuery, roomsQuery } from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/reservas")({
  head: () => ({ meta: [{ title: "Solicitações de reserva — Liga UNI" }] }),
  component: AdminReservas,
});

function AdminReservas() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: entities = [] } = useQuery(entitiesQuery);

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const note = status === "rejected" ? prompt("Motivo da recusa (opcional):") : null;
      const { error } = await supabase.from("reservations").update({ status, admin_note: note || null }).eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => {
      toast.success(s === "approved" ? "Reserva aprovada" : "Reserva recusada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const list = res.filter((r) => tab === "all" || r.status === tab);

  return (
    <>
      <PageHeader title="Solicitações de reserva" description="Aprove ou recuse pedidos dos líderes" />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Recusadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead><TableHead>Sala</TableHead><TableHead>Período</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nada por aqui.</TableCell></TableRow>)}
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{entities.find((e) => e.id === r.entity_id)?.nome}</TableCell>
                <TableCell>{rooms.find((x) => x.id === r.room_id)?.nome}</TableCell>
                <TableCell className="text-sm">{fmtDateTime(r.inicio)}<br />{fmtDateTime(r.fim)}</TableCell>
                <TableCell className="max-w-xs text-sm">{r.motivo}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {r.status !== "approved" && (
                    <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: r.id, status: "approved" })}><Check /> Aprovar</Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="ghost" className="ml-1" onClick={() => respond.mutate({ id: r.id, status: "rejected" })}><X /> Recusar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
