import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { Card, PageHeader } from "@/components/AppShell";
import { NeedEntity } from "@/components/NeedEntity";
import { Button } from "@/components/ui/button";
import {
  calculateSemesterRequirements,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lider/exigencias")({
  component: LiderExigenciasPage,
});

const reqIconMap = {
  reunioes: Megaphone,
  staff: HandHelping,
  capacitacoes: GraduationCap,
  oficinas: Lightbulb,
} as const;

function LiderExigenciasPage() {
  const { user } = Route.useRouteContext();
  const { data: entity, isLoading } = useQuery(myEntityQuery(user.id));
  const id = entity?.id;

  const myTrainingRegs = useQuery({ ...trainingRegistrationsQuery(id), enabled: !!id });
  const myStaffVols = useQuery({ ...staffVolunteersQuery(id), enabled: !!id });
  const myWorkshops = useQuery({ ...peerWorkshopsQuery(id), enabled: !!id });
  const meetings = useQuery(generalMeetingsQuery);
  const myAttendances = useQuery({ ...meetingAttendancesQuery(id), enabled: !!id });

  if (isLoading) return null;
  if (!entity) return <NeedEntity />;

  const semesterReqs = calculateSemesterRequirements({
    entityId: entity.id,
    generalMeetings: meetings.data ?? [],
    meetingAttendances: myAttendances.data ?? [],
    staffVolunteers: myStaffVols.data ?? [],
    trainingRegistrations: myTrainingRegs.data ?? [],
    peerWorkshops: myWorkshops.data ?? [],
  });

  const progressPct = Math.round(
    (semesterReqs.fulfilledCount / semesterReqs.totalRequirements) * 100,
  );

  return (
    <>
      <PageHeader
        title="Exigências Semestrais de Permanência"
        description={`Acompanhe o progresso da equipe ${entity.nome} nas metas do semestre ${semesterReqs.semesterLabel}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/lider">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar ao painel
            </Link>
          </Button>
        }
      />

      {/* Resumo Geral em Amarelo/Âmbar suave (ou Verde quando concluído) */}
      <div
        className={
          semesterReqs.isCompliant
            ? "mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-6 shadow-card"
            : "mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 sm:p-6 shadow-card"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  semesterReqs.isCompliant
                    ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                    : "inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300"
                }
              >
                {semesterReqs.isCompliant ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {semesterReqs.fulfilledCount}/{semesterReqs.totalRequirements} exigências
                semestrais cumpridas
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <RefreshCw className="h-3 w-3" /> Ciclo {semesterReqs.semesterLabel} · Renova a
                cada semestre
              </span>
            </div>

            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
              {semesterReqs.isCompliant
                ? "Parabéns! Sua equipe está em dia com todas as metas do semestre."
                : `Pendências atuais: ${semesterReqs.missingRequirementsCount} de ${semesterReqs.totalRequirements} exigências do semestre`}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
              Para manter o vínculo ativo na Liga UNI e continuar usufruindo das salas e benefícios
              do Ágora Tech Park, cada entidade universitária deve concluir as 4 entregas abaixo ao
              longo do semestre.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-right shadow-2xs">
            <div className="text-xs font-medium text-muted-foreground">Progresso do Semestre</div>
            <div
              className={
                semesterReqs.isCompliant
                  ? "font-display text-2xl font-bold text-emerald-600"
                  : "font-display text-2xl font-bold text-amber-600"
              }
            >
              {progressPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Cards detalhados das 4 exigências */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {semesterReqs.items.map((item) => {
          const Icon = reqIconMap[item.key];
          const pct = Math.min(100, Math.round((item.current / item.target) * 100));
          return (
            <Card
              key={item.key}
              className={
                item.fulfilled
                  ? "flex flex-col justify-between border-emerald-500/35"
                  : "flex flex-col justify-between border-amber-500/45 bg-amber-500/[0.03]"
              }
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        item.fulfilled
                          ? "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600"
                          : "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600"
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.shortTitle}</p>
                    </div>
                  </div>

                  <span
                    className={
                      item.fulfilled
                        ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                        : "inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300"
                    }
                  >
                    {item.fulfilled ? "✓ Cumprida" : item.statusText}
                  </span>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.ruleDescription}
                </p>
              </div>

              <div className="mt-5 space-y-2.5 border-t pt-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso registrado no semestre:</span>
                  <span className="font-bold text-foreground">
                    {item.current} de {item.target}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={
                      item.fulfilled
                        ? "h-full rounded-full bg-emerald-500 transition-all"
                        : "h-full rounded-full bg-amber-500 transition-all"
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="pt-1 flex justify-end">
                  <Button
                    asChild
                    variant={item.fulfilled ? "outline" : "default"}
                    size="sm"
                  >
                    <Link to={item.to} search={item.search}>
                      {item.fulfilled ? "Ver atividade" : "Ir para atividade para cumprir"}{" "}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
