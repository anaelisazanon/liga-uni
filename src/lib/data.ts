import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Entity = Database["public"]["Tables"]["entities"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LeaderRequest = Database["public"]["Tables"]["leader_requests"]["Row"];
export type Training = Database["public"]["Tables"]["trainings"]["Row"];
export type TrainingRegistration = Database["public"]["Tables"]["training_registrations"]["Row"];
export type StaffCall = Database["public"]["Tables"]["staff_calls"]["Row"];
export type StaffVolunteer = Database["public"]["Tables"]["staff_volunteers"]["Row"];
export type PeerWorkshop = Database["public"]["Tables"]["peer_workshops"]["Row"];
export type GeneralMeeting = Database["public"]["Tables"]["general_meetings"]["Row"];
export type MeetingAttendance = Database["public"]["Tables"]["meeting_attendances"]["Row"];
export type AdminMessage = Database["public"]["Tables"]["admin_messages"]["Row"];
export type RewardRedemption = Database["public"]["Tables"]["reward_redemptions"]["Row"];
export type BusySlot = { inicio: string; fim: string };

// Regras de LigaCoins (troca colaborativa escalável por membros participantes + bônus por evento)
// Reuniões Liga UNI e Staff em Eventos valem muitos pontos por exigirem maior comprometimento das equipes!
// Capacitações NUNCA gastam moedas: elas sempre GANHAM +5 LC por membro + 10 LC por evento!
export const CREDITS_WELCOME = 30;
export const CREDITS_PER_MEETING_EVENT = 50; // +50 LC fixos por presença na Reunião Liga UNI
export const CREDITS_PER_MEETING_MEMBER = 25; // +25 LC por representante presente na Reunião Liga UNI
export const CREDITS_PER_MEETING = 75;
export const CREDITS_PER_PEER_WORKSHOP = 25; // +25 LC base por oficina oferecida
export const CREDITS_PER_WORKSHOP_MEMBER = 10; // +10 LC por membro ministrante/presente na oficina
export const CREDITS_PER_JOINT_WORKSHOP_BONUS = 20; // +20 LC bônus por oficina em conjunto com outro projeto
export const CREDITS_PER_STAFF_EVENT = 40; // +40 LC fixos por evento apoiado como Staff
export const CREDITS_PER_STAFF_MEMBER = 30; // +30 LC por voluntário atuando como Staff
export const CREDITS_PER_TRAINING_EVENT = 10; // +10 LC por capacitação participada
export const CREDITS_PER_TRAINING_MEMBER = 5; // +5 LC por membro participando de capacitação
export const CREDITS_PER_STAFF = 70;
export const CREDITS_COST_ROOM = 15;

export const CHAMADO_TOPICOS = [
  "Salas & Equipamentos",
  "LigaCoins & Benefícios",
  "Capacitações & Staff",
  "Reuniões Liga UNI",
  "Eventos & Calendário",
  "Outros Assuntos",
] as const;

export type RewardItem = {
  id: string;
  titulo: string;
  descricao: string;
  custo: number;
  categoria: "Ecossistema" | "Divulgação" | "Estrutura" | "Reconhecimento";
};

export const REWARD_CATALOG: RewardItem[] = [
  {
    id: "mentoria-empresa",
    titulo: "Mentoria VIP com Empresa Residente do Ágora",
    descricao:
      "Sessão exclusiva de 1h30 de mentoria técnica, produto ou captação de patrocínio com especialistas de empresas do Ágora Tech Park.",
    custo: 100,
    categoria: "Ecossistema",
  },
  {
    id: "divulgacao-oficial",
    titulo: "Destaque nas Redes Oficiais do Ágora & Liga UNI",
    descricao:
      "Post/Reels institucional destacando as conquistas, processo seletivo ou protótipo da sua entidade nos canais do Ágora.",
    custo: 150,
    categoria: "Divulgação",
  },
  {
    id: "estande-mostra",
    titulo: "Estande / Bancada Garantida na Mostra Tecnológica",
    descricao:
      "Espaço privilegiado no Hall Principal do Ágora para exposição do protótipo e captação de parceiros durante os grandes eventos.",
    custo: 220,
    categoria: "Estrutura",
  },
  {
    id: "coffee-integracao",
    titulo: "Kit Coffee Break para Evento ou Workshop da Equipe",
    descricao:
      "Apoio com café e lanches fornecidos pela organização para um workshop ou reunião aberta realizada pela sua entidade no Ágora.",
    custo: 280,
    categoria: "Estrutura",
  },
  {
    id: "kit-destaque-ano",
    titulo: "Troféu & Kit Liga UNI — Prêmio Entidade Destaque do Ano",
    descricao:
      "Reconhecimento oficial na cerimônia de encerramento do ano com certificado de excelência, brindes personalizados para a equipe e destaque no relatório anual do Ágora.",
    custo: 400,
    categoria: "Reconhecimento",
  },
];

export function countParticipants(listStr: string): number {
  if (!listStr || !listStr.trim()) return 0;
  return listStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function calcTrainingCoins(memberCount: number): number {
  if (memberCount <= 0) return 0;
  return CREDITS_PER_TRAINING_EVENT + memberCount * CREDITS_PER_TRAINING_MEMBER;
}

export function calcStaffCoins(memberCount: number): number {
  if (memberCount <= 0) return 0;
  return CREDITS_PER_STAFF_EVENT + memberCount * CREDITS_PER_STAFF_MEMBER;
}

export function calcMeetingCoins(memberCount: number): number {
  if (memberCount <= 0) return 0;
  return CREDITS_PER_MEETING_EVENT + memberCount * CREDITS_PER_MEETING_MEMBER;
}

export function calcWorkshopCoins(memberCount: number, isJoint?: boolean): number {
  if (memberCount <= 0) return 0;
  return (
    CREDITS_PER_PEER_WORKSHOP +
    memberCount * CREDITS_PER_WORKSHOP_MEMBER +
    (isJoint ? CREDITS_PER_JOINT_WORKSHOP_BONUS : 0)
  );
}

export function calculateEntityCoins({
  reservations = [],
  trainingRegistrations = [],
  staffVolunteers = [],
  peerWorkshops = [],
  meetingAttendances = [],
  rewardRedemptions = [],
}: {
  reservations?: Reservation[];
  trainingRegistrations?: TrainingRegistration[];
  staffVolunteers?: StaffVolunteer[];
  peerWorkshops?: PeerWorkshop[];
  meetingAttendances?: MeetingAttendance[];
  generalMeetings?: GeneralMeeting[];
  rewardRedemptions?: RewardRedemption[];
}) {
  const approvedStaff = staffVolunteers.filter((v) => v.moedas_liberadas);
  const pendingStaff = staffVolunteers.filter((v) => !v.moedas_liberadas);

  const staffEarned = approvedStaff.reduce(
    (acc, v) => acc + calcStaffCoins(Math.max(1, countParticipants(v.participantes))),
    0,
  );
  const staffPending = pendingStaff.reduce(
    (acc, v) => acc + calcStaffCoins(Math.max(1, countParticipants(v.participantes))),
    0,
  );

  const approvedTrainings = trainingRegistrations.filter((r) => r.moedas_liberadas);
  const pendingTrainings = trainingRegistrations.filter((r) => !r.moedas_liberadas);

  const trainingEarned = approvedTrainings.reduce(
    (acc, r) => acc + calcTrainingCoins(Math.max(1, countParticipants(r.participantes))),
    0,
  );
  const trainingPending = pendingTrainings.reduce(
    (acc, r) => acc + calcTrainingCoins(Math.max(1, countParticipants(r.participantes))),
    0,
  );

  const approvedWorkshops = peerWorkshops.filter((w) => w.moedas_liberadas);
  const pendingWorkshops = peerWorkshops.filter(
    (w) => !w.moedas_liberadas && w.status !== "rejected",
  );

  const workshopEarned = approvedWorkshops.reduce(
    (acc, w) =>
      acc +
      calcWorkshopCoins(
        Math.max(1, countParticipants(w.ministrantes)),
        Boolean(w.em_conjunto && w.partner_entity_id),
      ),
    0,
  );
  const workshopPending = pendingWorkshops.reduce(
    (acc, w) =>
      acc +
      calcWorkshopCoins(
        Math.max(1, countParticipants(w.ministrantes)),
        Boolean(w.em_conjunto && w.partner_entity_id),
      ),
    0,
  );

  const approvedAttendances = meetingAttendances.filter((a) => a.presente && a.moedas_liberadas);
  const pendingAttendances = meetingAttendances.filter((a) => a.presente && !a.moedas_liberadas);

  const meetingPoints = approvedAttendances.reduce(
    (acc, a) => acc + calcMeetingCoins(Math.max(1, countParticipants(a.representantes))),
    0,
  );

  const pendingMeetingPoints = pendingAttendances.reduce(
    (acc, a) => acc + calcMeetingCoins(Math.max(1, countParticipants(a.representantes))),
    0,
  );

  const earnedCredits =
    CREDITS_WELCOME + meetingPoints + staffEarned + trainingEarned + workshopEarned;

  const pendingCredits =
    pendingMeetingPoints + staffPending + trainingPending + workshopPending;

  // Apenas reservas aprovadas com finalidade 'reuniao_projeto' gastam LigaCoins; 'capacitacao_geral' é isenta (0 LigaCoins)
  const paidRoomReservations = reservations.filter(
    (r) => r.status === "approved" && (r.purpose ?? "reuniao_projeto") === "reuniao_projeto",
  );
  const freeRoomReservations = reservations.filter(
    (r) => r.status === "approved" && r.purpose === "capacitacao_geral",
  );

  const activeRedemptions = rewardRedemptions.filter((red) => red.status !== "rejected");
  const redemptionsSpent = activeRedemptions.reduce((acc, red) => acc + red.custo, 0);

  const usedCredits = paidRoomReservations.length * CREDITS_COST_ROOM + redemptionsSpent;

  const balanceCredits = Math.max(0, earnedCredits - usedCredits);

  return {
    earnedCredits,
    pendingCredits,
    usedCredits,
    balanceCredits,
    redemptionsSpent,
    staffEarned,
    staffPending,
    trainingEarned,
    trainingPending,
    meetingPoints,
    pendingMeetingPoints,
    approvedStaffCount: approvedStaff.length,
    pendingStaffCount: pendingStaff.length,
    approvedTrainingsCount: approvedTrainings.length,
    pendingTrainingsCount: pendingTrainings.length,
    approvedWorkshopsCount: approvedWorkshops.length,
    pendingWorkshopsCount: pendingWorkshops.length,
    approvedMeetingsCount: approvedAttendances.length,
    pendingMeetingsCount: pendingAttendances.length,
    paidRoomResCount: paidRoomReservations.length,
    freeRoomResCount: freeRoomReservations.length,
  };
}

export const CURRENT_SEMESTER_LABEL = "2026/2";
export const SEMESTER_GOAL_STAFF = 2; // Ajudar em 2 eventos como Staff no semestre
export const SEMESTER_GOAL_TRAININGS = 2; // Participar de 2 Capacitações UNI no semestre
export const SEMESTER_GOAL_WORKSHOPS = 1; // Oferecer pelo menos 1 Oficina no semestre

export type SemesterRequirementItem = {
  key: "reunioes" | "staff" | "capacitacoes" | "oficinas";
  title: string;
  shortTitle: string;
  ruleDescription: string;
  current: number;
  target: number;
  missing: number;
  fulfilled: boolean;
  statusText: string;
  to: string;
  search?: { tab?: string };
};

export type SemesterRequirementsSummary = {
  semesterLabel: string;
  fulfilledCount: number;
  totalRequirements: number;
  missingRequirementsCount: number;
  isCompliant: boolean;
  isCriticalAlert: boolean;
  items: SemesterRequirementItem[];
};

/**
 * Calcula o cumprimento das exigências semestrais de permanência na Liga UNI (renovadas todo semestre):
 * 1. Presença em TODAS as Reuniões Gerais da Liga UNI do semestre
 * 2. Ajudar em X eventos como Staff (meta: 2 por semestre)
 * 3. Participar de X Capacitações UNI (meta: 2 por semestre)
 * 4. Oferecer X Oficinas para outras equipes (meta: 1 por semestre)
 */
export function calculateSemesterRequirements({
  entityId,
  generalMeetings = [],
  meetingAttendances = [],
  staffVolunteers = [],
  trainingRegistrations = [],
  peerWorkshops = [],
}: {
  entityId?: string;
  generalMeetings?: GeneralMeeting[];
  meetingAttendances?: MeetingAttendance[];
  staffVolunteers?: StaffVolunteer[];
  trainingRegistrations?: TrainingRegistration[];
  peerWorkshops?: PeerWorkshop[];
}): SemesterRequirementsSummary {
  const activeMeetings = generalMeetings.filter((m) => m.ativa);
  const targetMeetings = Math.max(2, activeMeetings.length);

  // Entidades do catálogo geral (ent-2 a ent-17) já estão em dia no semestre atual;
  // ent-1 (GERM), ent-udesc-ficticio (Grupo Quasar — UDESC Teste) e novas entidades usam os registros reais do banco.
  const isCatalogCompliantEntity =
    Boolean(entityId) &&
    entityId !== "ent-1" &&
    entityId !== "ent-udesc-ficticio" &&
    /^ent-\d+$/.test(entityId!);

  const myAttendancesCount = entityId
    ? meetingAttendances.filter((a) => a.entity_id === entityId && a.presente).length
    : 0;
  const myStaffCount = entityId
    ? staffVolunteers.filter((v) => v.entity_id === entityId).length
    : 0;
  const myTrainingsCount = entityId
    ? trainingRegistrations.filter((r) => r.entity_id === entityId).length
    : 0;
  const myWorkshopsCount = entityId
    ? peerWorkshops.filter(
        (w) =>
          (w.entity_id === entityId || w.partner_entity_id === entityId) &&
          w.status !== "rejected",
      ).length
    : 0;

  const meetingsDone = isCatalogCompliantEntity
    ? targetMeetings
    : Math.min(targetMeetings, myAttendancesCount);
  const staffDone = isCatalogCompliantEntity
    ? SEMESTER_GOAL_STAFF
    : Math.min(SEMESTER_GOAL_STAFF, myStaffCount);
  const trainingsDone = isCatalogCompliantEntity
    ? SEMESTER_GOAL_TRAININGS
    : Math.min(SEMESTER_GOAL_TRAININGS, myTrainingsCount);
  const workshopsDone = isCatalogCompliantEntity
    ? SEMESTER_GOAL_WORKSHOPS
    : Math.min(SEMESTER_GOAL_WORKSHOPS, myWorkshopsCount);

  const missingMeetings = Math.max(0, targetMeetings - meetingsDone);
  const missingStaff = Math.max(0, SEMESTER_GOAL_STAFF - staffDone);
  const missingTrainings = Math.max(0, SEMESTER_GOAL_TRAININGS - trainingsDone);
  const missingWorkshops = Math.max(0, SEMESTER_GOAL_WORKSHOPS - workshopsDone);

  const items: SemesterRequirementItem[] = [
    {
      key: "reunioes",
      title: "Presença em todas as Reuniões Liga UNI",
      shortTitle: "Reuniões Liga UNI",
      ruleDescription: `Comparecer em 100% das reuniões gerais do semestre (${targetMeetings} convocadas)`,
      current: meetingsDone,
      target: targetMeetings,
      missing: missingMeetings,
      fulfilled: missingMeetings === 0,
      statusText:
        missingMeetings === 0
          ? "Em dia em todas as reuniões"
          : `Falta${missingMeetings > 1 ? "m" : ""} ${missingMeetings} reunião${missingMeetings > 1 ? "ões" : ""}`,
      to: "/lider/reunioes",
    },
    {
      key: "staff",
      title: "Ajudar como Staff em Eventos",
      shortTitle: "Staff em Eventos",
      ruleDescription: `Atuar como staff em pelo menos ${SEMESTER_GOAL_STAFF} eventos do Ágora no semestre`,
      current: staffDone,
      target: SEMESTER_GOAL_STAFF,
      missing: missingStaff,
      fulfilled: missingStaff === 0,
      statusText:
        missingStaff === 0
          ? "Meta de Staff cumprida"
          : `Falta${missingStaff > 1 ? "m" : ""} ${missingStaff} evento${missingStaff > 1 ? "s" : ""} como Staff`,
      to: "/lider/capacitacoes",
      search: { tab: "staff" },
    },
    {
      key: "capacitacoes",
      title: "Participar de Capacitações UNI",
      shortTitle: "Capacitações UNI",
      ruleDescription: `Inscrever membros em pelo menos ${SEMESTER_GOAL_TRAININGS} capacitações da Liga UNI`,
      current: trainingsDone,
      target: SEMESTER_GOAL_TRAININGS,
      missing: missingTrainings,
      fulfilled: missingTrainings === 0,
      statusText:
        missingTrainings === 0
          ? "Meta de Capacitações cumprida"
          : `Falta${missingTrainings > 1 ? "m" : ""} ${missingTrainings} capacitação${missingTrainings > 1 ? "ões" : ""}`,
      to: "/lider/capacitacoes",
      search: { tab: "capacitacoes" },
    },
    {
      key: "oficinas",
      title: "Oferecer Oficina pela Equipe",
      shortTitle: "Oferecer Oficina",
      ruleDescription: `Ministrar pelo menos ${SEMESTER_GOAL_WORKSHOPS} oficina para outras entidades no semestre`,
      current: workshopsDone,
      target: SEMESTER_GOAL_WORKSHOPS,
      missing: missingWorkshops,
      fulfilled: missingWorkshops === 0,
      statusText:
        missingWorkshops === 0
          ? "Meta de Oficina cumprida"
          : `Falta ${missingWorkshops} oficina no semestre`,
      to: "/lider/capacitacoes",
      search: { tab: "oficinas" },
    },
  ];

  const fulfilledCount = items.filter((i) => i.fulfilled).length;
  const totalRequirements = items.length;
  const missingRequirementsCount = totalRequirements - fulfilledCount;

  return {
    semesterLabel: CURRENT_SEMESTER_LABEL,
    fulfilledCount,
    totalRequirements,
    missingRequirementsCount,
    isCompliant: missingRequirementsCount === 0,
    isCriticalAlert: entityId === "ent-udesc-ficticio" || fulfilledCount <= 1,
    items,
  };
}

const unwrap = <T>(r: { data: T | null; error: unknown }) => {
  if (r.error) throw r.error;
  return r.data as T;
};

export const myProfileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-profile", userId],
    queryFn: async () =>
      unwrap(
        await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      ) as Profile | null,
  });

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: async () =>
    (unwrap(await supabase.from("profiles").select("*").order("nome")) ?? []) as Profile[],
});

export const leaderRequestsQuery = queryOptions({
  queryKey: ["leader-requests"],
  queryFn: async () =>
    (unwrap(
      await supabase.from("leader_requests").select("*").order("created_at", { ascending: false }),
    ) ?? []) as LeaderRequest[],
});

export const myEntityQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-entity", userId],
    queryFn: async () =>
      unwrap(
        await supabase.from("entities").select("*").eq("leader_id", userId).maybeSingle(),
      ) as Entity | null,
  });

export const entitiesQuery = queryOptions({
  queryKey: ["entities"],
  queryFn: async () =>
    (unwrap(await supabase.from("entities").select("*").order("nome")) ?? []) as Entity[],
});

export const membersQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["members", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("members").select("*").order("nome");
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as Member[];
    },
  });

export const eventsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["events", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("inicio");
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as Event[];
    },
  });

export const roomsQuery = queryOptions({
  queryKey: ["rooms"],
  queryFn: async () =>
    (unwrap(await supabase.from("rooms").select("*").order("nome")) ?? []) as Room[],
});

export const reservationsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["reservations", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("reservations").select("*").order("inicio", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as Reservation[];
    },
  });

export const trainingsQuery = queryOptions({
  queryKey: ["trainings"],
  queryFn: async () =>
    (unwrap(await supabase.from("trainings").select("*").order("inicio")) ?? []) as Training[],
});

export const trainingRegistrationsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["training-registrations", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("training_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as TrainingRegistration[];
    },
  });

export const staffCallsQuery = queryOptions({
  queryKey: ["staff-calls"],
  queryFn: async () =>
    (unwrap(await supabase.from("staff_calls").select("*").order("inicio")) ?? []) as StaffCall[],
});

export const staffVolunteersQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["staff-volunteers", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("staff_volunteers")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as StaffVolunteer[];
    },
  });

export const peerWorkshopsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["peer-workshops", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("peer_workshops")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as PeerWorkshop[];
    },
  });

export const generalMeetingsQuery = queryOptions({
  queryKey: ["general-meetings"],
  queryFn: async () =>
    (unwrap(await supabase.from("general_meetings").select("*").order("inicio")) ??
      []) as GeneralMeeting[],
});

export const meetingAttendancesQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["meeting-attendances", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("meeting_attendances")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as MeetingAttendance[];
    },
  });

export const adminMessagesQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["admin-messages", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("admin_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as AdminMessage[];
    },
  });

export const rewardRedemptionsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["reward-redemptions", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("reward_redemptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return (unwrap(await q) ?? []) as RewardRedemption[];
    },
  });

export const roomBusyQuery = (roomId: string, fromIso: string, toIso: string) =>
  queryOptions({
    queryKey: ["room-busy", roomId, fromIso, toIso],
    queryFn: async () => {
      if (!roomId) return [] as BusySlot[];
      const client = supabase as unknown as {
        rpc: (
          fn: string,
          args: { _room: string; _from: string; _to: string },
        ) => Promise<{ data: BusySlot[] | null; error: unknown }>;
      };
      const res = await client.rpc("room_busy", { _room: roomId, _from: fromIso, _to: toIso });
      if (res.error) {
        console.warn("[room_busy]", res.error);
        return [] as BusySlot[];
      }
      return (res.data ?? []) as BusySlot[];
    },
  });
