import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  adminMessagesQuery,
  calculateSemesterRequirements,
  entitiesQuery,
  generalMeetingsQuery,
  leaderRequestsQuery,
  meetingAttendancesQuery,
  peerWorkshopsQuery,
  portalConfigQuery,
  reservationsQuery,
  rewardRedemptionsQuery,
  staffVolunteersQuery,
  trainingRegistrationsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/lider" });
  },
  head: () => ({ meta: [{ title: "Administração — Liga UNI" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();
  const { data: entities = [] } = useQuery(entitiesQuery);
  const { data: meetings = [] } = useQuery(generalMeetingsQuery);
  const { data: res = [] } = useQuery(reservationsQuery());
  const { data: reqs = [] } = useQuery(leaderRequestsQuery);
  const { data: trainingRegs = [] } = useQuery(trainingRegistrationsQuery());
  const { data: staffVols = [] } = useQuery(staffVolunteersQuery());
  const { data: workshops = [] } = useQuery(peerWorkshopsQuery());
  const { data: attendances = [] } = useQuery(meetingAttendancesQuery());
  const { data: redemptions = [] } = useQuery(rewardRedemptionsQuery());
  const { data: msgs = [] } = useQuery(adminMessagesQuery());
  useQuery(portalConfigQuery);

  const adminSemesterAlertsCount = entities.filter(
    (e) =>
      !calculateSemesterRequirements({
        entityId: e.id,
        generalMeetings: meetings,
        meetingAttendances: attendances,
        staffVolunteers: staffVols,
        trainingRegistrations: trainingRegs,
        peerWorkshops: workshops,
      }).isCompliant,
  ).length;

  const pendingMeetingsCount = attendances.filter((a) => a.presente && !a.moedas_liberadas).length;
  const pendingTrainingsCount = trainingRegs.filter((r) => !r.moedas_liberadas).length;
  const pendingStaffCount = staffVols.filter((v) => !v.moedas_liberadas).length;
  const pendingWorkshopsCount = workshops.filter(
    (w) => w.status === "pending" || (w.status === "approved" && !w.moedas_liberadas),
  ).length;
  const pendingResCount = res.filter((r) => r.status === "pending").length;
  const pendingReqCount = reqs.filter((r) => r.status === "pending").length;
  const pendingRedemptionsCount = redemptions.filter((r) => r.status === "pending").length;
  const pendingBenefitsAndLeadersCount = pendingRedemptionsCount + pendingReqCount;
  const pendingMsgsCount = msgs.filter((m) => m.status === "pending").length;

  const totalPendingApprovals =
    pendingMeetingsCount +
    pendingTrainingsCount +
    pendingStaffCount +
    pendingWorkshopsCount +
    pendingResCount +
    pendingBenefitsAndLeadersCount;

  const isOnAprovacoes = location.pathname.startsWith("/admin/aprovacoes");
  const searchParams = new URLSearchParams(location.searchStr || "");
  const currentTab = searchParams.get("tab");

  const nav = [
    { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
    {
      to: "/admin/aprovacoes",
      label: "Aprovações",
      icon: ClipboardCheck,
      count: totalPendingApprovals,
      isActive: isOnAprovacoes && !currentTab,
      children: [
        {
          to: "/admin/aprovacoes",
          search: { tab: "reunioes" },
          label: "Reuniões Liga UNI",
          icon: Megaphone,
          count: pendingMeetingsCount,
          isActive: isOnAprovacoes && currentTab === "reunioes",
        },
        {
          to: "/admin/aprovacoes",
          search: { tab: "capacitacoes" },
          label: "Capacitações UNI",
          icon: GraduationCap,
          count: pendingTrainingsCount,
          isActive: isOnAprovacoes && currentTab === "capacitacoes",
        },
        {
          to: "/admin/aprovacoes",
          search: { tab: "staff" },
          label: "Staff em Eventos",
          icon: HandHelping,
          count: pendingStaffCount,
          isActive: isOnAprovacoes && currentTab === "staff",
        },
        {
          to: "/admin/aprovacoes",
          search: { tab: "oficinas" },
          label: "Oficinas de Equipes",
          icon: Lightbulb,
          count: pendingWorkshopsCount,
          isActive: isOnAprovacoes && currentTab === "oficinas",
        },
        {
          to: "/admin/aprovacoes",
          search: { tab: "reservas" },
          label: "Reservas de Sala",
          icon: DoorOpen,
          count: pendingResCount,
          isActive: isOnAprovacoes && currentTab === "reservas",
        },
        {
          to: "/admin/aprovacoes",
          search: { tab: "beneficios-cadastros" },
          label: "Benefícios & Cadastros",
          icon: Gift,
          count: pendingBenefitsAndLeadersCount,
          isActive: isOnAprovacoes && currentTab === "beneficios-cadastros",
        },
      ],
    },
    { to: "/admin/entidades", label: "Entidades", icon: Building2, count: pendingReqCount },
    { to: "/admin/capacitacoes", label: "Eventos & Capacitações", icon: CalendarPlus },
    { to: "/admin/configuracoes", label: "Salas, Benefícios & Config.", icon: Settings2 },
    { to: "/admin/calendario", label: "Calendário", icon: CalendarDays },
    { to: "/admin/chamados", label: "Chamados", icon: MessageSquare, count: pendingMsgsCount },
  ];

  return (
    <AppShell
      nav={nav}
      badge="Administrador"
      subtitle="Gestão do Ágora"
      adminSemesterAlertsCount={adminSemesterAlertsCount}
      guideTo="/admin/guia"
    >
      <Outlet />
    </AppShell>
  );
}
