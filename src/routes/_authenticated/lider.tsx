import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  DoorOpen,
  GraduationCap,
  HandHelping,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import {
  calculateEntityCoins,
  calculateSemesterRequirements,
  generalMeetingsQuery,
  meetingAttendancesQuery,
  myEntityQuery,
  peerWorkshopsQuery,
  reservationsQuery,
  rewardRedemptionsQuery,
  staffCallsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
  trainingsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lider")({
  beforeLoad: ({ context }) => {
    if (context.role === "admin") throw redirect({ to: "/admin" });
  },
  head: () => ({ meta: [{ title: "Painel do Líder — Liga UNI" }] }),
  component: LiderLayout,
});

function LiderLayout() {
  const { user } = Route.useRouteContext();
  const location = useLocation();
  const { data: entity } = useQuery(myEntityQuery(user.id));
  const id = entity?.id;

  const { data: trainings = [] } = useQuery(trainingsQuery);
  const { data: calls = [] } = useQuery(staffCallsQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: reservations = [] } = useQuery({ ...reservationsQuery(id), enabled: !!id });
  const { data: trainingRegs = [] } = useQuery({
    ...trainingRegistrationsQuery(id),
    enabled: !!id,
  });
  const { data: staffVols = [] } = useQuery({ ...staffVolunteersQuery(id), enabled: !!id });
  const { data: workshops = [] } = useQuery({ ...peerWorkshopsQuery(id), enabled: !!id });
  const { data: attendances = [] } = useQuery({ ...meetingAttendancesQuery(id), enabled: !!id });
  const { data: redemptions = [] } = useQuery({ ...rewardRedemptionsQuery(id), enabled: !!id });

  const coins = calculateEntityCoins({
    reservations,
    trainingRegistrations: trainingRegs,
    staffVolunteers: staffVols,
    peerWorkshops: workshops,
    meetingAttendances: attendances,
    generalMeetings: meetings,
    rewardRedemptions: redemptions,
  });

  const semesterRequirements = entity
    ? calculateSemesterRequirements({
        entityId: entity.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      })
    : undefined;

  const now = new Date();
  const activeTrainingsCount = trainings.filter(
    (t) => t.ativa && new Date(t.fim) >= now,
  ).length;
  const openCallsCount = calls.filter((c) => c.ativa && new Date(c.fim) >= now).length;
  const openMeetingsCount = meetings.filter(
    (m) => m.ativa && new Date(m.fim) >= now,
  ).length;
  const pendingResCount = reservations.filter((r) => r.status === "pending").length;

  const isAtividades = location.pathname.startsWith("/lider/capacitacoes");
  const currentTab = (location.search as Record<string, string | undefined>)["tab"];

  const nav: NavItem[] = [
    { to: "/lider", label: "Painel", icon: LayoutDashboard, exact: true },
    {
      to: "/lider/reunioes",
      label: "Reuniões Liga UNI",
      icon: Megaphone,
      count: openMeetingsCount,
    },
    {
      to: "/lider/capacitacoes",
      label: "Atividades & Salas",
      icon: GraduationCap,
      isActive: isAtividades && !currentTab,
      children: [
        {
          to: "/lider/capacitacoes",
          search: { tab: "capacitacoes" },
          label: "Capacitações UNI",
          icon: GraduationCap,
          count: activeTrainingsCount,
          isActive: isAtividades && currentTab === "capacitacoes",
        },
        {
          to: "/lider/capacitacoes",
          search: { tab: "staff" },
          label: "Staff",
          icon: HandHelping,
          count: openCallsCount,
          isActive: isAtividades && currentTab === "staff",
        },
        {
          to: "/lider/capacitacoes",
          search: { tab: "oficinas" },
          label: "Oferecer Oficina",
          icon: Lightbulb,
          isActive: isAtividades && currentTab === "oficinas",
        },
        {
          to: "/lider/capacitacoes",
          search: { tab: "reunioes-equipe" },
          label: "Reuniões de Equipe",
          icon: DoorOpen,
          count: pendingResCount,
          isActive: isAtividades && currentTab === "reunioes-equipe",
        },
      ],
    },
    { to: "/lider/calendario", label: "Calendário", icon: CalendarDays },
  ];

  return (
    <AppShell
      nav={nav}
      badge="Líder"
      subtitle={entity?.nome ?? "Sem entidade cadastrada"}
      subtitleTo="/lider/equipe"
      coinsBalance={entity ? coins.balanceCredits : undefined}
      coinsPending={entity ? coins.pendingCredits : undefined}
      coinsTo="/lider/ligacoins"
      semesterRequirements={semesterRequirements}
      guideTo="/lider/guia"
      contactEntityId={entity?.id}
    >
      <Outlet />
    </AppShell>
  );
}
