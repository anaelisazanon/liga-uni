import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { AdminTeamsPendingDashboard } from "@/components/AdminTeamsPendingDashboard";
import { Button } from "@/components/ui/button";
import {
  calculateSemesterRequirements,
  CURRENT_SEMESTER_LABEL,
  entitiesQuery,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  peerWorkshopsQuery,
  portalConfigQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/pendencias-semestrais")({
  head: () => ({ meta: [{ title: "Pendências Semestrais — Admin Liga UNI" }] }),
  component: AdminPendenciasSemestraisPage,
});

function AdminPendenciasSemestraisPage() {
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: portalConfig } = useQuery(portalConfigQuery);
  const semesterLabel = portalConfig?.semesterLabel ?? CURRENT_SEMESTER_LABEL;

  const nonCompliantEntities = entities.filter(
    (e) =>
      !calculateSemesterRequirements({
        entityId: e.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      }).isCompliant,
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs text-muted-foreground">
          <Link to="/admin">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar para Visão Geral
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Alerta de Permanência Semestral"
        description={`Acompanhamento das equipes com exigências pendentes no semestre ${semesterLabel} e envio de notificação por e-mail aos líderes.`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/configuracoes" search={{ tab: "regras" }}>
              <Settings2 className="mr-1.5 h-4 w-4 text-primary" /> Editar quantidade de exigências
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-destructive/35 bg-destructive/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive font-display text-lg font-black text-destructive-foreground">
              !
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {nonCompliantEntities.length} equipe(s) com exigências pendentes no semestre{" "}
                  {semesterLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <RefreshCw className="h-3 w-3" /> Metas renovadas todo semestre
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Regras semestrais configuradas:{" "}
                {portalConfig?.goalMeetingsAll ?? true
                  ? "presença em 100% das Reuniões Liga UNI"
                  : `presença em ${portalConfig?.goalMeetingsCustom ?? 2} Reunião(ões) Liga UNI`}
                , {portalConfig?.goalStaff ?? 2} atuação(ões) como Staff,{" "}
                {portalConfig?.goalTrainings ?? 2} Capacitação(ões) UNI e{" "}
                {portalConfig?.goalWorkshops ?? 1} Oficina(s) oferecida(s).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista horizontal de equipes com filtro padrão somente com pendências (podendo alternar para todas) */}
      <AdminTeamsPendingDashboard defaultFilter="pending" />
    </div>
  );
}
