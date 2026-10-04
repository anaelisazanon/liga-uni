import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { entitiesQuery, membersQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/entidades")({
  head: () => ({ meta: [{ title: "Entidades e membros — Liga UNI" }] }),
  component: EntidadesPage,
});

function EntidadesPage() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: members = [] } = useQuery(membersQuery());
  const [q, setQ] = useState("");
  const term = q.toLowerCase();
  const filtered = entities.filter(
    (e) =>
      e.nome.toLowerCase().includes(term) ||
      members.some((m) => m.entity_id === e.id && (m.nome + m.curso).toLowerCase().includes(term)),
  );

  return (
    <>
      <PageHeader
        title="Entidades e membros"
        description={`${entities.length} entidades · ${members.length} membros`}
        action={<Input placeholder="Buscar entidade, membro ou curso" className="w-72" value={q} onChange={(e) => setQ(e.target.value)} />}
      />
      {filtered.length === 0 && <p className="text-muted-foreground">Nenhuma entidade encontrada.</p>}
      <Accordion type="multiple" className="space-y-3">
        {filtered.map((e) => {
          const ms = members.filter((m) => m.entity_id === e.id);
          return (
            <AccordionItem key={e.id} value={e.id} className="rounded-xl border bg-card px-5 shadow-card">
              <AccordionTrigger>
                <div className="text-left">
                  <div className="font-semibold">{e.nome}</div>
                  <div className="text-xs font-normal text-muted-foreground">{ms.length} membros · {e.descricao || "Sem descrição"}</div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Curso</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {ms.length === 0 && (<TableRow><TableCell colSpan={3} className="text-muted-foreground">Sem membros.</TableCell></TableRow>)}
                    {ms.map((m) => (
                      <TableRow key={m.id}><TableCell>{m.nome}</TableCell><TableCell>{m.email}</TableCell><TableCell>{m.curso}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}
