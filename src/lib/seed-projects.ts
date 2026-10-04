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
  // 1. GERM (UDESC Joinville) - Líder principal do botão de teste
  {
    id: "ent-1",
    leaderId: "user-leader-1",
    leaderNome: "Líder do GERM (UDESC)",
    leaderEmail: "lider.teste@example.com",
    nome: "GERM — Grupo de Estudos em Robótica Móvel (UDESC Joinville)",
    descricao:
      "O GERM é um grupo de robótica da Universidade do Estado de Santa Catarina - UDESC que tem dois grandes objetivos: contribuir para a inclusão social de diversos grupos da sociedade por intermédio de atividades relacionadas com a robótica móvel; e auxiliar na melhoria da formação dos estudantes de graduação da UDESC-Joinville. O Grupo é formado por discentes de vários cursos do Centro de Ciências Tecnológicas da UDESC e conta com a participação de professores de diversos departamentos deste centro. Nossa missão: Difundir o conhecimento em robótica na sociedade, incentivar os acadêmicos a desenvolver conhecimentos na área e integrar-se com a comunidade para fomentar o interesse em ciência e tecnologia. Contato: comunicacao.cct@udesc.br",
    members: [
      { id: "mem-1", nome: "Carlos Eduardo", email: "carlos@edu.udesc.br", curso: "Engenharia Elétrica" },
      { id: "mem-2", nome: "Beatriz Souza", email: "beatriz@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-3", nome: "Rafael Mendes", email: "rafael@edu.udesc.br", curso: "Ciência da Computação" },
      { id: "mem-4", nome: "Juliana Costa", email: "juliana@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
    ],
  },
  // 2. Fórmula CEM (UFSC Joinville)
  {
    id: "ent-2",
    leaderId: "user-leader-2",
    leaderNome: "Líder da Fórmula CEM (UFSC)",
    leaderEmail: "lider.formulacem@example.com",
    nome: "Fórmula CEM (UFSC Joinville)",
    descricao:
      "A equipe Fórmula CEM tem como principal objetivo desenvolver modelos de veículos do tipo Fórmula-SAE com motor a combustão (IC) e elétrico (EV), para participar dos eventos de competição estudantil que são promovidos pela Associação dos Engenheiros da Mobilidade (SAE) do Brasil. Em 2019, obteve a primeira colocação no quesito “eficiência – categoria combustão” na competição nacional. E em 2021, o carro elétrico ficou na terceira posição da mesma competição. Instagram: @formulacem",
    members: [
      { id: "mem-5", nome: "Lucas Ferreira", email: "lucas.ferreira@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-6", nome: "Mariana Alves", email: "mariana.alves@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
      { id: "mem-7", nome: "Gabriel Rocha", email: "gabriel.rocha@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-8", nome: "Fernanda Lima", email: "fernanda.lima@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 3. Barco Solar Babitonga (UFSC Joinville)
  {
    id: "ent-3",
    leaderId: "user-leader-3",
    leaderNome: "Líder Barco Solar Babitonga",
    leaderEmail: "babitonga@joinville.ufsc.br",
    nome: "Barco Solar Babitonga (UFSC Joinville)",
    descricao:
      "Equipe de competição de embarcações movidas exclusivamente por energia solar fotovoltaica. Área: Engenharia e Energia Solar. Contatos: Instagram @equipebabitonga · babitonga.webnode.com",
    members: [
      { id: "mem-9", nome: "Pedro Henrique", email: "pedro.babitonga@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-10", nome: "Camila Martins", email: "camila.babitonga@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 4. Botcem (UFSC Joinville)
  {
    id: "ent-4",
    leaderId: "user-leader-4",
    leaderNome: "Líder Botcem",
    leaderEmail: "botcem@joinville.ufsc.br",
    nome: "Botcem (UFSC Joinville)",
    descricao:
      "Equipe de robótica (mecânica, eletrônica e programação), criada em 2011 na UFSC Joinville. Área: Ciência e Tecnologia, Mecatrônica e Naval. Contatos: Instagram @botcem · https://botcem.ufsc.br",
    members: [
      { id: "mem-11", nome: "Thiago Ribeiro", email: "thiago.botcem@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
      { id: "mem-12", nome: "Larissa Gomes", email: "larissa.botcem@grad.ufsc.br", curso: "Bacharelado em Ciência e Tecnologia" },
    ],
  },
  // 5. Bateria Nota CEM (UFSC Joinville)
  {
    id: "ent-5",
    leaderId: "user-leader-5",
    leaderNome: "Líder Bateria Nota CEM",
    leaderEmail: "notacem@joinville.ufsc.br",
    nome: "Bateria Nota CEM (UFSC Joinville)",
    descricao:
      "Bateria universitária musical em formação reduzida, apresentando diversos ritmos em eventos e competições. Área: Artes e Música. Contato: Instagram @baterianotacem",
    members: [
      { id: "mem-13", nome: "Matheus Vieira", email: "matheus.notacem@grad.ufsc.br", curso: "Engenharia de Transportes e Logística" },
      { id: "mem-14", nome: "Bruna Cardoso", email: "bruna.notacem@grad.ufsc.br", curso: "Engenharia Civil de Infraestrutura" },
    ],
  },
  // 6. Cheerleaders Camaleão (UFSC Joinville)
  {
    id: "ent-6",
    leaderId: "user-leader-6",
    leaderNome: "Líder Cheerleaders Camaleão",
    leaderEmail: "camaleao@joinville.ufsc.br",
    nome: "Cheerleaders Camaleão (UFSC Joinville)",
    descricao:
      "Equipe de cheerleading universitário com participação em campeonatos internos e externos. Área: Esportes. Contato: Instagram @cheerleaders_camaleao",
    members: [
      { id: "mem-15", nome: "Amanda Teixeira", email: "amanda.camaleao@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-16", nome: "Diego Santos", email: "diego.camaleao@grad.ufsc.br", curso: "Engenharia Automotiva" },
    ],
  },
  // 7. CTJ Baja UFSC
  {
    id: "ent-7",
    leaderId: "user-leader-7",
    leaderNome: "Líder CTJ Baja UFSC",
    leaderEmail: "ctjbaja@joinville.ufsc.br",
    nome: "CTJ Baja UFSC (UFSC Joinville)",
    descricao:
      "Desenvolvimento de veículos off-road para competições regionais e nacionais Baja SAE. Área: Engenharia Mecânica e Automotiva. Contatos: Instagram @ctjbajaufsc · https://sites.google.com/view/ctjbajaufsc",
    members: [
      { id: "mem-17", nome: "Gustavo Almeida", email: "gustavo.baja@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-18", nome: "Natália Barros", email: "natalia.baja@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 8. CEMCODES (UFSC Joinville)
  {
    id: "ent-8",
    leaderId: "user-leader-8",
    leaderNome: "Líder CEMCODES",
    leaderEmail: "cemcodes@joinville.ufsc.br",
    nome: "CEMCODES (UFSC Joinville)",
    descricao:
      "Grupo de programação competitiva e participação em maratonas de programação. Área: Ciência da Computação e Algoritmos. Contatos: Instagram @cemcodes · https://cemcodes.joinville.ufsc.br/",
    members: [
      { id: "mem-19", nome: "Henrique Castro", email: "henrique.cemcodes@grad.ufsc.br", curso: "Bacharelado em Ciência e Tecnologia" },
      { id: "mem-20", nome: "Sofia Oliveira", email: "sofia.cemcodes@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 9. DRACONIS (UFSC Joinville)
  {
    id: "ent-9",
    leaderId: "user-leader-9",
    leaderNome: "Líder DRACONIS",
    leaderEmail: "draconis@joinville.ufsc.br",
    nome: "DRACONIS — Drone Design (UFSC Joinville)",
    descricao:
      "Equipe de Drone Design voltada ao projeto e desenvolvimento de drones autônomos. Área: Eletrônica e Mecânica. Contato: Instagram @draconisdrones",
    members: [
      { id: "mem-21", nome: "Leonardo Pires", email: "leonardo.draconis@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-22", nome: "Isabela Moraes", email: "isabela.draconis@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 10. DUNA (UFSC Joinville)
  {
    id: "ent-10",
    leaderId: "user-leader-10",
    leaderNome: "Líder DUNA",
    leaderEmail: "duna@joinville.ufsc.br",
    nome: "DUNA — Desafio Universitário de Nautidesign (UFSC Joinville)",
    descricao:
      "Organização do Desafio Universitário de Nautidesign, criado na UFSC Joinville em 2013. Área: Engenharia Naval. Contatos: Instagram @oficialduna · www.oficialduna.com",
    members: [
      { id: "mem-23", nome: "Vitor Hugo", email: "vitor.duna@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-24", nome: "Helena Duarte", email: "helena.duna@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 11. Eficem (UFSC Joinville)
  {
    id: "ent-11",
    leaderId: "user-leader-11",
    leaderNome: "Líder Eficem",
    leaderEmail: "eficem@joinville.ufsc.br",
    nome: "Eficem (UFSC Joinville)",
    descricao:
      "Desenvolvimento de protótipos automobilísticos com foco em eficiência energética. Área: Engenharia Automotiva. Contatos: Instagram @eficemufsc · www.eficem.ufsc.br",
    members: [
      { id: "mem-25", nome: "Rodrigo Nunes", email: "rodrigo.eficem@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-26", nome: "Clara Machado", email: "clara.eficem@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 12. Holandês Voador (UFSC Joinville)
  {
    id: "ent-12",
    leaderId: "user-leader-12",
    leaderNome: "Líder Holandês Voador",
    leaderEmail: "holandesvoador@joinville.ufsc.br",
    nome: "Holandês Voador (UFSC Joinville)",
    descricao:
      "Equipe de nautimodelismo, bicampeã do DUNA (2017 e 2018). Área: Engenharia Naval. Contatos: Instagram @hvnauti_ · www.hvduna.wixsite.com/website",
    members: [
      { id: "mem-27", nome: "Arthur Azevedo", email: "arthur.hv@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-28", nome: "Lívia Freitas", email: "livia.hv@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 13. Hydra (UFSC Joinville)
  {
    id: "ent-13",
    leaderId: "user-leader-13",
    leaderNome: "Líder Hydra",
    leaderEmail: "hydra@joinville.ufsc.br",
    nome: "Hydra Nautidesign (UFSC Joinville)",
    descricao:
      "Equipe de nautimodelismo criada em 2017 para o desafio DUNA. Área: Engenharia Naval. Contato: Instagram @hydranautidesign",
    members: [
      { id: "mem-29", nome: "Caio Monteiro", email: "caio.hydra@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-30", nome: "Marina Rezende", email: "marina.hydra@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 14. InfraTEC (UFSC Joinville)
  {
    id: "ent-14",
    leaderId: "user-leader-14",
    leaderNome: "Líder InfraTEC",
    leaderEmail: "infratec@joinville.ufsc.br",
    nome: "InfraTEC (UFSC Joinville)",
    descricao:
      "Desenvolvimento de protótipos e soluções em diversas áreas da infraestrutura. Área: Engenharia Civil de Infraestrutura. Contatos: Instagram @infratec · www.infratec.ufsc.br",
    members: [
      { id: "mem-31", nome: "Daniel Borges", email: "daniel.infratec@grad.ufsc.br", curso: "Engenharia Civil de Infraestrutura" },
      { id: "mem-32", nome: "Paula Guimarães", email: "paula.infratec@grad.ufsc.br", curso: "Engenharia Civil de Infraestrutura" },
    ],
  },
  // 15. Kosmos Rocketry (UFSC Joinville)
  {
    id: "ent-15",
    leaderId: "user-leader-15",
    leaderNome: "Líder Kosmos Rocketry",
    leaderEmail: "kosmos@joinville.ufsc.br",
    nome: "Kosmos Rocketry (UFSC Joinville)",
    descricao:
      "Equipe de projeto e lançamento de foguetes de sondagem experimental. Área: Engenharia Aeroespacial / Aeronáutica. Contato: Instagram @kosmosrocketry",
    members: [
      { id: "mem-33", nome: "Felipe Siqueira", email: "felipe.kosmos@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-34", nome: "Carolina Dias", email: "carolina.kosmos@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
    ],
  },
  // 16. Nisus Aerodesign (UFSC Joinville)
  {
    id: "ent-16",
    leaderId: "user-leader-16",
    leaderNome: "Líder Nisus Aerodesign",
    leaderEmail: "nisus@joinville.ufsc.br",
    nome: "Nisus Aerodesign (UFSC Joinville)",
    descricao:
      "Desenvolvimento de aeronaves rádio controladas para a competição SAE Brasil AeroDesign. Área: Engenharia Aeroespacial / Aeronáutica. Contatos: Instagram @equipe_nisus · www.nisus.joinville.ufsc.br",
    members: [
      { id: "mem-35", nome: "André Ramos", email: "andre.nisus@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
      { id: "mem-36", nome: "Letícia Prado", email: "leticia.nisus@grad.ufsc.br", curso: "Engenharia Aeroespacial" },
    ],
  },
  // 17. Seven Seas Nautidesign (UFSC Joinville)
  {
    id: "ent-17",
    leaderId: "user-leader-17",
    leaderNome: "Líder Seven Seas",
    leaderEmail: "sevenseas@joinville.ufsc.br",
    nome: "Seven Seas Nautidesign (UFSC Joinville)",
    descricao:
      "Projeto de rebocador em escala reduzida para o DUNA, fundada em 2019. Área: Engenharia Naval. Contatos: Instagram @sevenseasnautidesign · https://sevenseasufsc.wixsite.com/sevenseasnautidesign",
    members: [
      { id: "mem-37", nome: "Bruno Cavalcanti", email: "bruno.sevenseas@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-38", nome: "Aline Fonseca", email: "aline.sevenseas@grad.ufsc.br", curso: "Engenharia Naval" },
    ],
  },
  // 18. Terra (UFSC Joinville)
  {
    id: "ent-18",
    leaderId: "user-leader-18",
    leaderNome: "Líder Equipe Terra",
    leaderEmail: "terra@joinville.ufsc.br",
    nome: "Terra — Veículo Submarino Autônomo (UFSC Joinville)",
    descricao:
      "Desenvolvimento de veículo submarino autônomo (AUV). Área: Engenharia Naval e Eletrônica. Contatos: Instagram @terracompetition · www.terra.joinville.ufsc.br",
    members: [
      { id: "mem-39", nome: "Murilo Santana", email: "murilo.terra@grad.ufsc.br", curso: "Engenharia Naval" },
      { id: "mem-40", nome: "Bianca Lopes", email: "bianca.terra@grad.ufsc.br", curso: "Engenharia Mecatrônica" },
    ],
  },
  // 19. PantH₂era E-Racing (UFSC Joinville)
  {
    id: "ent-19",
    leaderId: "user-leader-19",
    leaderNome: "Líder PantH₂era E-Racing",
    leaderEmail: "panthera@joinville.ufsc.br",
    nome: "PantH₂era E-Racing (UFSC Joinville)",
    descricao:
      "Equipe de Fórmula SAE híbrido com sistema a hidrogênio. Área: Engenharia Automotiva e Energia. Contato: Instagram @panthera.ufsc",
    members: [
      { id: "mem-41", nome: "Otávio Medeiros", email: "otavio.panthera@grad.ufsc.br", curso: "Engenharia Automotiva" },
      { id: "mem-42", nome: "Victória Cunha", email: "victoria.panthera@grad.ufsc.br", curso: "Engenharia Ferroviária e Metroviária" },
    ],
  },
  // 20. Albatroz Aerodesign (UDESC Joinville)
  {
    id: "ent-20",
    leaderId: "user-leader-20",
    leaderNome: "Líder Albatroz Aerodesign",
    leaderEmail: "albatroz@edu.udesc.br",
    nome: "Albatroz Aerodesign (UDESC Joinville)",
    descricao:
      "Aeronaves rádio controladas em escala reduzida para o SAE Brasil AeroDesign. Existe desde 2001 no CCT/UDESC e é aberta a estudantes de qualquer curso. Contato: Instagram @albatrozaerodesign",
    members: [
      { id: "mem-43", nome: "Guilherme Tavares", email: "guilherme.albatroz@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-44", nome: "Luana Pacheco", email: "luana.albatroz@edu.udesc.br", curso: "Engenharia Elétrica" },
    ],
  },
  // 21. Baja UDESC (Velociraptor)
  {
    id: "ent-21",
    leaderId: "user-leader-21",
    leaderNome: "Líder Baja UDESC",
    leaderEmail: "bajaudesc@gmail.com",
    nome: "Baja UDESC — Velociraptor (UDESC Joinville)",
    descricao:
      "Desenvolvimento de veículo off-road para a competição Baja SAE Brasil por estudantes de Engenharia Mecânica e Elétrica da UDESC Joinville. Contato: bajaudesc@gmail.com",
    members: [
      { id: "mem-45", nome: "Renan Coutinho", email: "renan.baja@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-46", nome: "Patrícia Sales", email: "patricia.baja@edu.udesc.br", curso: "Engenharia Elétrica" },
    ],
  },
  // 22. E-Force Fórmula SAE (UDESC Joinville)
  {
    id: "ent-22",
    leaderId: "user-leader-22",
    leaderNome: "Líder E-Force Fórmula SAE",
    leaderEmail: "admeforce@gmail.com",
    nome: "E-Force Fórmula SAE (UDESC Joinville)",
    descricao:
      "Desenvolvimento de carros Fórmula SAE elétricos, fundada em 2018 no CCT/UDESC com primeira competição oficial em 2022 e cerca de 25 membros. Contatos: Instagram @eforceudesc · admeforce@gmail.com · www.eforceudesc.com",
    members: [
      { id: "mem-47", nome: "Vinícius Andrade", email: "vinicius.eforce@edu.udesc.br", curso: "Engenharia Elétrica" },
      { id: "mem-48", nome: "Laura Peixoto", email: "laura.eforce@edu.udesc.br", curso: "Engenharia Mecânica" },
    ],
  },
  // 23. Maratona de Programação — É Sempre o XOR (UDESC Joinville)
  {
    id: "ent-23",
    leaderId: "user-leader-23",
    leaderNome: "Líder Maratona de Programação UDESC",
    leaderEmail: "maratona.cct@edu.udesc.br",
    nome: "Maratona de Programação — Equipe \"É Sempre o XOR\" (UDESC Joinville)",
    descricao:
      "Programa de extensão interinstitucional de programação competitiva do CCT/UDESC, coordenado pela profa. Karina Roggia. Em março de 2026 conquistou o 14º lugar no ICPC Latino-Americano e classificou-se para a final mundial. Contato: comunicacao.cct@udesc.br",
    members: [
      { id: "mem-49", nome: "Igor Vasconcelos", email: "igor.xor@edu.udesc.br", curso: "Ciência da Computação" },
      { id: "mem-50", nome: "Sabrina Nogueira", email: "sabrina.xor@edu.udesc.br", curso: "Tecnologia em Análise e Desenvolvimento de Sistemas" },
    ],
  },
  // 24. Smart Consultoria Jr (UDESC Joinville)
  {
    id: "ent-24",
    leaderId: "user-leader-24",
    leaderNome: "Líder Smart Consultoria Jr",
    leaderEmail: "smartjr@edu.udesc.br",
    nome: "Smart Consultoria Jr (UDESC Joinville)",
    descricao:
      "Empresa júnior do CCT/UDESC focada em consultoria empresarial: pesquisa de mercado, identidade organizacional e filosofia Lean. Localizada no Hub de Inovação do CCT (Bloco I). Contato: Instagram @smartconsultoriajr",
    members: [
      { id: "mem-51", nome: "Bárbara Queiroz", email: "barbara.smart@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
      { id: "mem-52", nome: "Fernando Guedes", email: "fernando.smart@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
    ],
  },
  // 25. Atrium Engenharia Jr (UDESC Joinville)
  {
    id: "ent-25",
    leaderId: "user-leader-25",
    leaderNome: "Líder Atrium Engenharia Jr",
    leaderEmail: "atriumjr@edu.udesc.br",
    nome: "Atrium Engenharia Jr (UDESC Joinville)",
    descricao:
      "Empresa júnior multidisciplinar de Engenharia Civil, Produção, Mecânica e Elétrica: projetos arquitetônicos, estruturais e elétricos. Contatos: Instagram @atrium.engenhariajr · https://atriumengenhariajr.com.br",
    members: [
      { id: "mem-53", nome: "Marcelo Paiva", email: "marcelo.atrium@edu.udesc.br", curso: "Engenharia Civil" },
      { id: "mem-54", nome: "Tatiane Rocha", email: "tatiane.atrium@edu.udesc.br", curso: "Engenharia Elétrica" },
    ],
  },
  // 26. Konvex Jr (UDESC Joinville)
  {
    id: "ent-26",
    leaderId: "user-leader-26",
    leaderNome: "Líder Konvex Jr",
    leaderEmail: "konvexjr@edu.udesc.br",
    nome: "Konvex Jr (UDESC Joinville)",
    descricao:
      "Empresa júnior de Engenharia Mecânica e Ciência da Computação: projeto de máquinas, desenvolvimento de sites, e-commerce e prototipagem. Contato: Instagram @konvexjr",
    members: [
      { id: "mem-55", nome: "Samuel Batista", email: "samuel.konvex@edu.udesc.br", curso: "Ciência da Computação" },
      { id: "mem-56", nome: "Rafaela Campos", email: "rafaela.konvex@edu.udesc.br", curso: "Engenharia Mecânica" },
    ],
  },
  // 27. Educar Jr (UDESC Joinville)
  {
    id: "ent-27",
    leaderId: "user-leader-27",
    leaderNome: "Líder Educar Jr",
    leaderEmail: "educajrcct@gmail.com",
    nome: "Educar Jr (UDESC Joinville)",
    descricao:
      "Empresa júnior das Licenciaturas em Química, Física e Matemática da UDESC Joinville, coordenada pelo prof. Volnei Soethe (aprovada em 2025, sala I307, Bloco I). Contato: educajrcct@gmail.com",
    members: [
      { id: "mem-57", nome: "Priscila Macedo", email: "priscila.educar@edu.udesc.br", curso: "Licenciatura em Física" },
      { id: "mem-58", nome: "Fábio Correia", email: "fabio.educar@edu.udesc.br", curso: "Licenciatura em Matemática" },
    ],
  },
  // 28. CADEE - Centro Acadêmico de Engenharia Elétrica (UDESC)
  {
    id: "ent-28",
    leaderId: "user-leader-28",
    leaderNome: "Líder CA Engenharia Elétrica",
    leaderEmail: "cadee@edu.udesc.br",
    nome: "Centro Acadêmico Democrático de Engenharia Elétrica (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Engenharia Elétrica do CCT/UDESC Joinville. Contato: Instagram @danmacct",
    members: [
      { id: "mem-59", nome: "Alexandre Pires", email: "alexandre.cadee@edu.udesc.br", curso: "Engenharia Elétrica" },
    ],
  },
  // 29. CAEM - Centro Acadêmico da Engenharia Mecânica (UDESC)
  {
    id: "ent-29",
    leaderId: "user-leader-29",
    leaderNome: "Líder CA Engenharia Mecânica",
    leaderEmail: "caem@edu.udesc.br",
    nome: "Centro Acadêmico da Engenharia Mecânica (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Engenharia Mecânica do CCT/UDESC Joinville. Contato: Instagram @vai.calc",
    members: [
      { id: "mem-60", nome: "Roberto Dias", email: "roberto.caem@edu.udesc.br", curso: "Engenharia Mecânica" },
    ],
  },
  // 30. CAEPS - Centro Acadêmico de Produção e Sistemas (UDESC)
  {
    id: "ent-30",
    leaderId: "user-leader-30",
    leaderNome: "Líder CAEPS",
    leaderEmail: "caeps@edu.udesc.br",
    nome: "Centro Acadêmico de Produção e Sistemas — CAEPS (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Engenharia de Produção e Sistemas do CCT/UDESC Joinville. Contato: Instagram @udesc.caeps",
    members: [
      { id: "mem-61", nome: "Mônica Silveira", email: "monica.caeps@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
    ],
  },
  // 31. CACIC - Centro Acadêmico de Ciência da Computação (UDESC)
  {
    id: "ent-31",
    leaderId: "user-leader-31",
    leaderNome: "Líder CACIC",
    leaderEmail: "cacic@edu.udesc.br",
    nome: "Centro Acadêmico de Ciência da Computação — CACIC (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Ciência da Computação do CCT/UDESC Joinville. Contato: Instagram @cacic_udesc",
    members: [
      { id: "mem-62", nome: "Luan Fernandes", email: "luan.cacic@edu.udesc.br", curso: "Ciência da Computação" },
    ],
  },
  // 32. CAFI - Centro Acadêmico de Física (UDESC)
  {
    id: "ent-32",
    leaderId: "user-leader-32",
    leaderNome: "Líder CAFI",
    leaderEmail: "cafi@edu.udesc.br",
    nome: "Centro Acadêmico de Física — CAFI (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Licenciatura em Física do CCT/UDESC Joinville. Contato: Instagram @cafi.cct",
    members: [
      { id: "mem-63", nome: "Sérgio Matos", email: "sergio.cafi@edu.udesc.br", curso: "Licenciatura em Física" },
    ],
  },
  // 33. CAMAT - Centro Acadêmico da Matemática (UDESC)
  {
    id: "ent-33",
    leaderId: "user-leader-33",
    leaderNome: "Líder CAMAT",
    leaderEmail: "camat@edu.udesc.br",
    nome: "Centro Acadêmico da Matemática — CAMAT (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Licenciatura em Matemática do CCT/UDESC Joinville. Contato: Instagram @camat.udesc",
    members: [
      { id: "mem-64", nome: "Elisa Pacheco", email: "elisa.camat@edu.udesc.br", curso: "Licenciatura em Matemática" },
    ],
  },
  // 34. CAQUI - Centro Acadêmico de Química (UDESC)
  {
    id: "ent-34",
    leaderId: "user-leader-34",
    leaderNome: "Líder CAQUI",
    leaderEmail: "caqui@edu.udesc.br",
    nome: "Centro Acadêmico de Química — CAQUI (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Licenciatura em Química do CCT/UDESC Joinville. Contato: Instagram @caqui.udesc",
    members: [
      { id: "mem-65", nome: "Vanessa Lima", email: "vanessa.caqui@edu.udesc.br", curso: "Licenciatura em Química" },
    ],
  },
  // 35. CALIC - Centro Acadêmico Livre da Civil (UDESC)
  {
    id: "ent-35",
    leaderId: "user-leader-35",
    leaderNome: "Líder CA Engenharia Civil",
    leaderEmail: "calic@edu.udesc.br",
    nome: "Centro Acadêmico Livre da Civil (UDESC Joinville)",
    descricao:
      "Representação estudantil do curso de Engenharia Civil do CCT/UDESC Joinville.",
    members: [
      { id: "mem-66", nome: "Eduardo Mello", email: "eduardo.civil@edu.udesc.br", curso: "Engenharia Civil" },
    ],
  },
  // 36. Associação Atlética Acadêmica CCT (UDESC)
  {
    id: "ent-36",
    leaderId: "user-leader-36",
    leaderNome: "Líder Atlética CCT",
    leaderEmail: "atletica@edu.udesc.br",
    nome: "Associação Atlética Acadêmica CCT (UDESC Joinville)",
    descricao:
      "Associação Atlética Acadêmica do Centro de Ciências Tecnológicas da UDESC Joinville, promovendo integração esportiva e eventos universitários. Contato: Instagram @atleticacct",
    members: [
      { id: "mem-67", nome: "César Augusto", email: "cesar.atletica@edu.udesc.br", curso: "Engenharia Mecânica" },
      { id: "mem-68", nome: "Milena Soares", email: "milena.atletica@edu.udesc.br", curso: "Engenharia de Produção e Sistemas" },
    ],
  },
];
