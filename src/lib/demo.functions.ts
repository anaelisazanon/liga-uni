// TODO remover antes de uso real
import { createServerFn } from "@tanstack/react-start";
import { DEMO_ADMIN_EMAIL, DEMO_LEADER_EMAIL, DEMO_PASSWORD } from "./demo";

export const ensureDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const demoFlag = process.env["DEMO_LOGIN"] ?? process.env["VITE_DEMO_LOGIN"];
  const hasSupabase = Boolean(
    process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"],
  );

  if (demoFlag === "false") {
    throw new Error("Login de teste desabilitado neste ambiente.");
  }

  // Se o backend Supabase não estiver configurado com service role no servidor, retorna silenciosamente
  // para que o cliente em memória (fallback) assuma o login de teste.
  if (!hasSupabase) {
    return { ok: true, mode: "mock" as const };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const ensureUser = async (email: string, nome: string) => {
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { nome },
      });
      return existingProfile.id;
    }

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      await supabaseAdmin.auth.admin.updateUserById(found.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { nome },
      });
      await supabaseAdmin.from("profiles").upsert({ id: found.id, email, nome });
      return found.id;
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? `Falha ao criar usuário de teste ${email}`);
    }

    await supabaseAdmin.from("profiles").upsert({ id: created.user.id, email, nome });
    return created.user.id;
  };

  const leaderId = await ensureUser(DEMO_LEADER_EMAIL, "Líder do GERM (UDESC)");
  const leader2Id = await ensureUser("lider.formulacem@example.com", "Líder da Fórmula CEM (UFSC)");
  const adminId = await ensureUser(DEMO_ADMIN_EMAIL, "Administrador Ágora");

  // Garante os papéis: líderes ficam só com leader; admin recebe admin e perde o leader criado pelo trigger
  await supabaseAdmin.from("user_roles").delete().eq("user_id", leaderId);
  await supabaseAdmin.from("user_roles").insert({ user_id: leaderId, role: "leader" });

  await supabaseAdmin.from("user_roles").delete().eq("user_id", leader2Id);
  await supabaseAdmin.from("user_roles").insert({ user_id: leader2Id, role: "leader" });

  await supabaseAdmin.from("user_roles").delete().eq("user_id", adminId);
  await supabaseAdmin.from("user_roles").insert({ user_id: adminId, role: "admin" });

  // Garante 3 salas de exemplo se não existirem salas cadastradas
  const { data: existingRooms } = await supabaseAdmin.from("rooms").select("id, nome");
  let roomIds: string[] = (existingRooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) {
    const { data: insertedRooms } = await supabaseAdmin
      .from("rooms")
      .insert([
        {
          nome: "Sala de reunião A (exemplo)",
          capacidade: 12,
          descricao: "Sala equipada com TV e quadro branco no Ágora Tech Park.",
          ativa: true,
        },
        {
          nome: "Sala de reunião B (exemplo)",
          capacidade: 20,
          descricao: "Espaço colaborativo para dinâmicas e reuniões de projetos.",
          ativa: true,
        },
        {
          nome: "Auditório Ágora (exemplo)",
          capacidade: 80,
          descricao: "Auditório para capacitações, workshops e hackathons.",
          ativa: true,
        },
      ])
      .select("id");
    roomIds = (insertedRooms ?? []).map((r) => r.id);
  }

  // Garante 1 entidade para o líder de teste (GERM - UDESC Joinville)
  const germNome = "GERM — Grupo de Estudos em Robótica Móvel (UDESC Joinville)";
  const germDescricao =
    "O GERM é um grupo de robótica da Universidade do Estado de Santa Catarina - UDESC que tem dois grandes objetivos: contribuir para a inclusão social de diversos grupos da sociedade por intermédio de atividades relacionadas com a robótica móvel; e auxiliar na melhoria da formação dos estudantes de graduação da UDESC-Joinville. O Grupo é formado por discentes de vários cursos do Centro de Ciências Tecnológicas da UDESC e conta com a participação de professores de diversos departamentos deste centro. Nossa missão: Difundir o conhecimento em robótica na sociedade, incentivar os acadêmicos a desenvolver conhecimentos na área e integrar-se com a comunidade para fomentar o interesse em ciência e tecnologia.";

  const { data: existingEntity } = await supabaseAdmin
    .from("entities")
    .select("id")
    .eq("leader_id", leaderId)
    .maybeSingle();

  let entityId = existingEntity?.id;
  if (!entityId) {
    const { data: createdEntity } = await supabaseAdmin
      .from("entities")
      .insert({
        nome: germNome,
        descricao: germDescricao,
        leader_id: leaderId,
      })
      .select("id")
      .single();
    entityId = createdEntity?.id;
  } else {
    await supabaseAdmin
      .from("entities")
      .update({ nome: germNome, descricao: germDescricao })
      .eq("id", entityId);
  }

  if (entityId) {
    // 4 membros com cursos variados do CCT/UDESC Joinville
    const { data: existingMembers } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("entity_id", entityId);

    if (!existingMembers || existingMembers.length === 0) {
      await supabaseAdmin.from("members").insert([
        {
          entity_id: entityId,
          nome: "Carlos Eduardo",
          email: "carlos@edu.udesc.br",
          curso: "Engenharia Elétrica",
        },
        {
          entity_id: entityId,
          nome: "Beatriz Souza",
          email: "beatriz@edu.udesc.br",
          curso: "Engenharia Mecânica",
        },
        {
          entity_id: entityId,
          nome: "Rafael Mendes",
          email: "rafael@edu.udesc.br",
          curso: "Ciência da Computação",
        },
        {
          entity_id: entityId,
          nome: "Juliana Costa",
          email: "juliana@edu.udesc.br",
          curso: "Engenharia de Produção e Sistemas",
        },
      ]);
    }

    // 3 eventos nas próximas semanas
    const { data: existingEvents } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("entity_id", entityId);

    let eventIds: string[] = (existingEvents ?? []).map((e) => e.id);
    const inDays = (days: number, hours: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hours, 0, 0, 0);
      return d.toISOString();
    };

    if (eventIds.length === 0) {
      const { data: createdEvents } = await supabaseAdmin
        .from("events")
        .insert([
          {
            entity_id: entityId,
            titulo: "Oficina de Robótica Móvel e Inclusão Social",
            descricao:
              "Atividade prática do GERM aberta à comunidade para fomentar o interesse em ciência e tecnologia.",
            local: "Sala de reunião A (exemplo)",
            inicio: inDays(2, 14),
            fim: inDays(2, 16),
          },
          {
            entity_id: entityId,
            titulo: "Mostra e Hackathon de Robótica no Ágora",
            descricao:
              "Imersão de dois dias com discentes do CCT/UDESC apresentando projetos de robótica móvel.",
            local: "Auditório Ágora (exemplo)",
            inicio: inDays(5, 9),
            fim: inDays(6, 18),
          },
          {
            entity_id: entityId,
            titulo: "Reunião Geral do GERM — UDESC Joinville",
            descricao:
              "Alinhamento das frentes de ensino, pesquisa e extensão dos cursos do Centro de Ciências Tecnológicas.",
            local: "Sala de reunião B (exemplo)",
            inicio: inDays(10, 19),
            fim: inDays(10, 21),
          },
        ])
        .select("id");
      eventIds = (createdEvents ?? []).map((e) => e.id);
    }

    // 1 reserva aprovada e 1 reserva pendente
    const { data: existingReservations } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("entity_id", entityId);

    if ((!existingReservations || existingReservations.length === 0) && roomIds.length > 0) {
      const roomA = roomIds[0]!;
      const roomB = roomIds[1] ?? roomIds[0]!;
      await supabaseAdmin.from("reservations").insert([
        {
          entity_id: entityId,
          event_id: eventIds[0] ?? null,
          room_id: roomA,
          requested_by: leaderId,
          motivo: "Realização da Oficina de Robótica Móvel e Inclusão Social pelo GERM (UDESC)",
          inicio: inDays(2, 14),
          fim: inDays(2, 16),
          status: "approved",
        },
        {
          entity_id: entityId,
          event_id: eventIds[2] ?? null,
          room_id: roomB,
          requested_by: leaderId,
          motivo: "Reunião Geral da equipe do GERM — UDESC Joinville",
          inicio: inDays(10, 19),
          fim: inDays(10, 21),
          status: "pending",
        },
      ]);
    }
  }

  // Garante a segunda entidade: Fórmula CEM (UFSC Joinville)
  const fcemNome = "Fórmula CEM (UFSC Joinville)";
  const fcemDescricao =
    "A equipe Fórmula CEM tem como principal objetivo desenvolver modelos de veículos do tipo Fórmula-SAE com motor a combustão (IC) e elétrico (EV), para participar dos eventos de competição estudantil que são promovidos pela Associação dos Engenheiros da Mobilidade (SAE) do Brasil. Em 2019, obteve a primeira colocação no quesito “eficiência – categoria combustão” na competição nacional. E em 2021, o carro elétrico ficou na terceira posição da mesma competição.";

  const { data: existingEntity2 } = await supabaseAdmin
    .from("entities")
    .select("id")
    .eq("leader_id", leader2Id)
    .maybeSingle();

  let entity2Id = existingEntity2?.id;
  if (!entity2Id) {
    const { data: createdEntity2 } = await supabaseAdmin
      .from("entities")
      .insert({
        nome: fcemNome,
        descricao: fcemDescricao,
        leader_id: leader2Id,
      })
      .select("id")
      .single();
    entity2Id = createdEntity2?.id;
  } else {
    await supabaseAdmin
      .from("entities")
      .update({ nome: fcemNome, descricao: fcemDescricao })
      .eq("id", entity2Id);
  }

  if (entity2Id) {
    const { data: existingMembers2 } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("entity_id", entity2Id);

    if (!existingMembers2 || existingMembers2.length === 0) {
      await supabaseAdmin.from("members").insert([
        {
          entity_id: entity2Id,
          nome: "Lucas Ferreira",
          email: "lucas.ferreira@grad.ufsc.br",
          curso: "Engenharia Automotiva",
        },
        {
          entity_id: entity2Id,
          nome: "Mariana Alves",
          email: "mariana.alves@grad.ufsc.br",
          curso: "Engenharia Mecatrônica",
        },
        {
          entity_id: entity2Id,
          nome: "Gabriel Rocha",
          email: "gabriel.rocha@grad.ufsc.br",
          curso: "Engenharia Aeroespacial",
        },
        {
          entity_id: entity2Id,
          nome: "Fernanda Lima",
          email: "fernanda.lima@grad.ufsc.br",
          curso: "Engenharia Naval",
        },
      ]);
    }

    const { data: existingEvents2 } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("entity_id", entity2Id);

    let event2Ids: string[] = (existingEvents2 ?? []).map((e) => e.id);
    const inDays = (days: number, hours: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hours, 0, 0, 0);
      return d.toISOString();
    };

    if (event2Ids.length === 0) {
      const { data: createdEvents2 } = await supabaseAdmin
        .from("events")
        .insert([
          {
            entity_id: entity2Id,
            titulo: "Apresentação dos Protótipos IC e EV — Fórmula CEM",
            descricao:
              "Demonstração técnica dos veículos Fórmula-SAE a combustão e elétrico desenvolvidos na UFSC Joinville.",
            local: "Auditório Ágora (exemplo)",
            inicio: inDays(4, 15),
            fim: inDays(4, 18),
          },
          {
            entity_id: entity2Id,
            titulo: "Revisão de Projeto para Competição SAE Brasil",
            descricao:
              "Reunião dos subsistemas de powertrain, aerodinâmica e eletrônica da equipe Fórmula CEM.",
            local: "Sala de reunião B (exemplo)",
            inicio: inDays(8, 14),
            fim: inDays(8, 17),
          },
        ])
        .select("id");
      event2Ids = (createdEvents2 ?? []).map((e) => e.id);
    }

    const { data: existingRes2 } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("entity_id", entity2Id);

    if ((!existingRes2 || existingRes2.length === 0) && roomIds.length > 0) {
      const roomAudit = roomIds[2] ?? roomIds[0]!;
      const roomB = roomIds[1] ?? roomIds[0]!;
      await supabaseAdmin.from("reservations").insert([
        {
          entity_id: entity2Id,
          event_id: event2Ids[0] ?? null,
          room_id: roomAudit,
          requested_by: leader2Id,
          motivo: "Apresentação dos Protótipos IC e EV da Fórmula CEM (UFSC Joinville)",
          inicio: inDays(4, 15),
          fim: inDays(4, 18),
          status: "approved",
        },
        {
          entity_id: entity2Id,
          event_id: event2Ids[1] ?? null,
          room_id: roomB,
          requested_by: leader2Id,
          motivo: "Revisão de Projeto para Competição SAE Brasil — Fórmula CEM (UFSC)",
          inicio: inDays(8, 14),
          fim: inDays(8, 17),
          status: "pending",
        },
      ]);
    }
  }

  return { ok: true, mode: "supabase" as const };
});
