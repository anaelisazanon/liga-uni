export type SeedProject = {
  id: string;
  leaderId: string;
  leaderNome: string;
  leaderEmail: string;
  nome: string;
  descricao: string;
  members: Array<{ id: string; nome: string; email: string; curso: string }>;
};

export const SEED_PROJECTS: SeedProject[] = [
  // ===========================================================================
  // UDESC Joinville
  // ===========================================================================
  // 1. GERM (UDESC Joinville) - Líder principal do botão de demonstração
  {
    id: "ent-1",
    leaderId: "user-leader-1",
    leaderNome: "Líder do GERM (UDESC)",
    leaderEmail: "lider.teste@example.com",
    nome: "GERM — Grupo Estudantil de Robótica Móvel (UDESC Joinville)",
    descricao:
      "Grupo de extensão (UDESC Joinville) · Grupo Estudantil de Robótica Móvel. Reúne bolsistas e voluntários em atividades de ensino, extensão e desenvolvimento tecnológico em robótica móvel. Também promove inclusão social por meio da robótica.",
    members: [
      { id: "mem-1", nome: "Carlos Eduardo", email: "carlos@edu.udesc.br", curso: "Engenharia Elétrica" },
      { id: "mem-2", nome: "Beatriz Souza", email: "beatriz@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-3", nome: "Rafael Mendes", email: "rafael@edu.udesc.br", curso: "Ciência da Computação" },
      { id: "mem-4", nome: "Juliana Costa", email: "juliana@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
    ],
  },
  // 2. AAACCT (UDESC Joinville)
  {
    id: "ent-2",
    leaderId: "user-leader-2",
    leaderNome: "Líder da AAACCT (UDESC)",
    leaderEmail: "aaacct@edu.udesc.br",
    nome: "AAACCT — Associação Atlética Acadêmica do CCT (UDESC Joinville)",
    descricao:
      "Atlética (UDESC Joinville) · Associação Atlética Acadêmica do Centro de Ciências Tecnológicas (CCT). Representa a UDESC Joinville em competições esportivas. Criada em 2005 para promover esporte e integração entre estudantes, organiza eventos esportivos, festas e atividades de integração.",
    members: [
      { id: "mem-5", nome: "César Augusto", email: "cesar.atletica@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-6", nome: "Milena Soares", email: "milena.atletica@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
      { id: "mem-7", nome: "Lucas Tavares", email: "lucas.atletica@edu.udesc.br", curso: "Engenharia Elétrica" },
    ],
  },
  // 3. Grupo Fictício da UDESC Joinville (Para teste de não cumprimento das exigências semestrais)
  {
    id: "ent-udesc-ficticio",
    leaderId: "user-leader-pendente",
    leaderNome: "Líder do Grupo Quasar (UDESC — Fictício)",
    leaderEmail: "lider.pendente@example.com",
    nome: "Grupo Quasar de Sistemas Autônomos (UDESC Joinville — Fictício)",
    descricao:
      "Grupo fictício da UDESC Joinville criado para demonstração e teste de alerta de equipe que ainda não cumpriu as exigências semestrais de permanência na Liga UNI.",
    members: [
      { id: "mem-8", nome: "Marcos Vinícius", email: "marcos.quasar@edu.udesc.br", curso: "Engenharia Elétrica" },
      { id: "mem-9", nome: "Camila Rocha", email: "camila.quasar@edu.udesc.br", curso: "Ciência da Computação" },
    ],
  },

  // ===========================================================================
  // IFSC Joinville
  // ===========================================================================
  // 4. STELLA (IFSC Joinville)
  {
    id: "ent-3",
    leaderId: "user-leader-3",
    leaderNome: "Líder do Projeto STELLA (IFSC)",
    leaderEmail: "stella@ifsc.edu.br",
    nome: "STELLA (IFSC Joinville)",
    descricao:
      "Projeto de extensão (IFSC Joinville) · Promove atividades interativas com alunas do ensino médio para incentivar a participação feminina em STEM (Ciência, Tecnologia, Engenharia e Matemática). Coordenado pela professora Joice.",
    members: [
      { id: "mem-10", nome: "Mariana Alves", email: "mariana.stella@aluno.ifsc.edu.br", curso: "Engenharia Elétrica" },
      { id: "mem-11", nome: "Fernanda Lima", email: "fernanda.stella@aluno.ifsc.edu.br", curso: "Engenharia Mecânica" },
    ],
  },

  // ===========================================================================
  // Univille
  // ===========================================================================
  // 5. LANENF (Univille)
  {
    id: "ent-4",
    leaderId: "user-leader-4",
    leaderNome: "Líder da LANENF (Univille)",
    leaderEmail: "lanenf@univille.br",
    nome: "LANENF — Liga Acadêmica de Enfermagem de Neurologia (Univille)",
    descricao:
      "Liga acadêmica (Univille) · Liga Acadêmica de Enfermagem de Neurologia, com atuação em ensino, pesquisa e extensão na área de neurologia e reabilitação pós-AVC.",
    members: [
      { id: "mem-12", nome: "Larissa Gomes", email: "larissa.lanenf@univille.br", curso: "Enfermagem" },
      { id: "mem-13", nome: "Bruna Cardoso", email: "bruna.lanenf@univille.br", curso: "Enfermagem" },
    ],
  },

  // ===========================================================================
  // UFSC Joinville — Equipes de Competição
  // ===========================================================================
  // 6. Babitonga (UFSC Joinville)
  {
    id: "ent-5",
    leaderId: "user-leader-5",
    leaderNome: "Líder da Babitonga (UFSC)",
    leaderEmail: "babitonga@joinville.ufsc.br",
    nome: "Babitonga (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Desenvolve barcos movidos exclusivamente por energia solar fotovoltaica. Participa do Desafio Solar Brasil desde 2010.",
    members: [
      { id: "mem-14", nome: "Pedro Henrique", email: "pedro.babitonga@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-15", nome: "Camila Martins", email: "camila.babitonga@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 7. BAJA UFSC (UFSC Joinville)
  {
    id: "ent-6",
    leaderId: "user-leader-6",
    leaderNome: "Líder da BAJA UFSC",
    leaderEmail: "baja@joinville.ufsc.br",
    nome: "BAJA UFSC (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Projeta e constrói veículos off-road para as competições regionais e nacionais da SAE Brasil.",
    members: [
      { id: "mem-16", nome: "Gustavo Almeida", email: "gustavo.baja@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-17", nome: "Natália Barros", email: "natalia.baja@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 8. Draconis (UFSC Joinville)
  {
    id: "ent-7",
    leaderId: "user-leader-7",
    leaderNome: "Líder da Draconis (UFSC)",
    leaderEmail: "draconis@joinville.ufsc.br",
    nome: "Draconis (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Compete e pesquisa projetos mecânicos e eletrônicos para drones autônomos.",
    members: [
      { id: "mem-18", nome: "Leonardo Pires", email: "leonardo.draconis@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-19", nome: "Isabela Moraes", email: "isabela.draconis@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 9. DUNA (UFSC Joinville)
  {
    id: "ent-8",
    leaderId: "user-leader-8",
    leaderNome: "Líder do DUNA (UFSC)",
    leaderEmail: "duna@joinville.ufsc.br",
    nome: "DUNA (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Desafio Universitário de Nautidesign, criado na UFSC Joinville em 2013. As equipes constroem modelos funcionais de embarcações em escala reduzida e os submetem a provas.",
    members: [
      { id: "mem-20", nome: "Vitor Hugo", email: "vitor.duna@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-21", nome: "Helena Duarte", email: "helena.duna@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 10. Eficem (UFSC Joinville)
  {
    id: "ent-9",
    leaderId: "user-leader-9",
    leaderNome: "Líder da Eficem (UFSC)",
    leaderEmail: "eficem@joinville.ufsc.br",
    nome: "Eficem (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Equipe de eficiência energética. Desenvolve protótipos automobilísticos e disputa principalmente a Shell Eco-marathon.",
    members: [
      { id: "mem-22", nome: "Rodrigo Nunes", email: "rodrigo.eficem@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-23", nome: "Clara Machado", email: "clara.eficem@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 11. Kosmos Rocketry (UFSC Joinville)
  {
    id: "ent-10",
    leaderId: "user-leader-10",
    leaderNome: "Líder da Kosmos Rocketry (UFSC)",
    leaderEmail: "kosmos@joinville.ufsc.br",
    nome: "Kosmos Rocketry (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Constrói foguetes de sondagem experimentais. Disputa a IREC (EUA) e a LASC (Brasil).",
    members: [
      { id: "mem-24", nome: "Felipe Siqueira", email: "felipe.kosmos@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-25", nome: "Carolina Dias", email: "carolina.kosmos@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
    ],
  },
  // 12. TERRA (UFSC Joinville)
  {
    id: "ent-11",
    leaderId: "user-leader-11",
    leaderNome: "Líder da TERRA (UFSC)",
    leaderEmail: "terra@joinville.ufsc.br",
    nome: "TERRA (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Pesquisa e desenvolve um veículo submarino autônomo (AUV) que coleta dados e amostras.",
    members: [
      { id: "mem-26", nome: "Murilo Santana", email: "murilo.terra@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-27", nome: "Bianca Lopes", email: "bianca.terra@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 13. PantH₂era E-Racing (UFSC Joinville)
  {
    id: "ent-12",
    leaderId: "user-leader-12",
    leaderNome: "Líder da PantH₂era E-Racing (UFSC)",
    leaderEmail: "panthera@joinville.ufsc.br",
    nome: "PantH₂era E-Racing (UFSC Joinville)",
    descricao:
      "Equipe de competição (UFSC Joinville) · Criada em 2026. Constrói carros Fórmula-SAE híbridos, com trem de força elétrico e um sistema de hidrogênio que recarrega a bateria.",
    members: [
      { id: "mem-28", nome: "Otávio Medeiros", email: "otavio.panthera@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-29", nome: "Victória Cunha", email: "victoria.panthera@grad.ufsc.br", curso: "Engenharia Ferroviária e Metroviária" },
    ],
  },

  // ===========================================================================
  // UFSC Joinville — Outras Entidades
  // ===========================================================================
  // 14. Bateria Nota Cem (UFSC Joinville)
  {
    id: "ent-13",
    leaderId: "user-leader-13",
    leaderNome: "Líder da Bateria Nota Cem (UFSC)",
    leaderEmail: "notacem@joinville.ufsc.br",
    nome: "Bateria Nota Cem (UFSC Joinville)",
    descricao:
      "Bateria universitária (UFSC Joinville) · Formação reduzida nos moldes de uma bateria de escola de samba. Participa de competições entre baterias.",
    members: [
      { id: "mem-30", nome: "Matheus Vieira", email: "matheus.notacem@grad.ufsc.br", curso: "Engenharia de Transportes e Logística" },
      { id: "mem-31", nome: "Aline Fonseca", email: "aline.notacem@grad.ufsc.br", curso: "Engenharia Civil de Infraestrutura" },
    ],
  },
  // 15. ETECH (UFSC Joinville)
  {
    id: "ent-14",
    leaderId: "user-leader-14",
    leaderNome: "Líder da ETECH (UFSC)",
    leaderEmail: "etech@joinville.ufsc.br",
    nome: "ETECH (UFSC Joinville)",
    descricao:
      "Empresa júnior (UFSC Joinville) · Empresa júnior de Engenharia Mecatrônica. Presta serviços nas áreas mecatrônica e tecnológica.",
    members: [
      { id: "mem-32", nome: "Thiago Ribeiro", email: "thiago.etech@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
      { id: "mem-33", nome: "Sofia Oliveira", email: "sofia.etech@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 16. GAPE TL (UFSC Joinville)
  {
    id: "ent-15",
    leaderId: "user-leader-15",
    leaderNome: "Líder do GAPE TL (UFSC)",
    leaderEmail: "gapetl@joinville.ufsc.br",
    nome: "GAPE TL (UFSC Joinville)",
    descricao:
      "Grupo de estudos (UFSC Joinville) · Grupo de Aplicação, Pesquisa e Extensão em Engenharia de Transportes e Logística. Faz projetos com empresas, pesquisa e extensão.",
    members: [
      { id: "mem-34", nome: "Daniel Borges", email: "daniel.gapetl@grad.ufsc.br", curso: "Engenharia de Transportes e Logística" },
      { id: "mem-35", nome: "Paula Guimarães", email: "paula.gapetl@grad.ufsc.br", curso: "Engenharia de Transportes e Logística" },
    ],
  },
  // 17. Calctec (UFSC Joinville)
  {
    id: "ent-16",
    leaderId: "user-leader-16",
    leaderNome: "Líder do Calctec (UFSC)",
    leaderEmail: "calctec@joinville.ufsc.br",
    nome: "Calctec (UFSC Joinville)",
    descricao:
      "Centro acadêmico (UFSC Joinville) · Centro Acadêmico Livre de Ciência e Tecnologia. Representa o Bacharelado em Ciência e Tecnologia e organiza rodas de conversa, visitas técnicas e a Semana Acadêmica (SAB Cientec).",
    members: [
      { id: "mem-36", nome: "Henrique Castro", email: "henrique.calctec@grad.ufsc.br", curso: "Bacharelado em Ciência e Tecnologia" },
      { id: "mem-37", nome: "Lívia Freitas", email: "livia.calctec@grad.ufsc.br", curso: "Bacharelado em Ciência e Tecnologia" },
    ],
  },
  // 18. PET – CTJ (UFSC Joinville)
  {
    id: "ent-17",
    leaderId: "user-leader-17",
    leaderNome: "Líder do PET – CTJ (UFSC)",
    leaderEmail: "petctj@joinville.ufsc.br",
    nome: "PET – CTJ (UFSC Joinville)",
    descricao:
      "Programa de Educação Tutorial (UFSC Joinville) · PET das engenharias da mobilidade. Foco em estimular a aprendizagem e o desenvolvimento científico no Centro Tecnológico de Joinville.",
    members: [
      { id: "mem-38", nome: "André Ramos", email: "andre.pet@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-39", nome: "Letícia Prado", email: "leticia.pet@grad.ufsc.br", curso: "Engenharia Automotiva" },
    ],
  },
];
