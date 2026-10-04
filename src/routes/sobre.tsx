import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Coins,
  DoorOpen,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  Network,
  Rocket,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CREDITS_PER_JOINT_WORKSHOP_BONUS,
  CREDITS_PER_MEETING_EVENT,
  CREDITS_PER_MEETING_MEMBER,
  CREDITS_PER_PEER_WORKSHOP,
  CREDITS_PER_STAFF_EVENT,
  CREDITS_PER_STAFF_MEMBER,
  CREDITS_PER_TRAINING_EVENT,
  CREDITS_PER_TRAINING_MEMBER,
  CREDITS_PER_WORKSHOP_MEMBER,
} from "@/lib/data";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Liga UNI — Ágora Tech Park" },
      {
        name: "description",
        content:
          "Conheça a iniciativa que aproxima projetos e entidades universitárias do ecossistema de inovação do Ágora Tech Park.",
      },
    ],
  }),
  component: SobrePage,
});

const pillars = [
  {
    icon: Users2,
    title: "Comunidade universitária ativa",
    text: "Reúne atléticas, empresas juniores, equipes de competição, ligas acadêmicas e grupos de pesquisa em uma única rede colaborativa.",
  },
  {
    icon: Rocket,
    title: "Acesso à infraestrutura do Ágora",
    text: "Salas de reunião, auditórios, espaços de coworking e laboratórios disponíveis na sub-aba Reuniões de Equipe para impulsionar projetos estudantis.",
  },
  {
    icon: Award,
    title: "LigaCoins & Loja de Benefícios",
    text: "Participe das Reuniões Liga UNI e atue como Staff em eventos do Ágora para ganhar muitos pontos e trocar por kits, mentorias, estandes e coffee break.",
  },
  {
    icon: Network,
    title: "Atividades & Salas unificadas",
    text: "Todas as oportunidades concentradas em sub-abas claras para os líderes (Capacitações UNI, Staff, Oferecer Oficina e Reuniões de Equipe) e Central de Aprovações horizontal para o Admin.",
  },
];

function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-liga-uni.png" alt="Liga UNI" className="h-9 w-9 object-contain" />
            <span className="font-display font-bold">Liga UNI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-1 size-4" /> Início
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">Acessar portal</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-hero text-primary-foreground py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <span className="text-xs uppercase tracking-widest text-accent font-semibold">
              Quem somos
            </span>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
              A ponte entre a universidade e o ecossistema de inovação.
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/85 leading-relaxed">
              A <strong>Liga UNI</strong> é um programa do <strong>Ágora Tech Park</strong> criado
              para apoiar, capacitar e conectar as entidades e projetos estudantis das
              universidades da região, oferecendo espaço físico, mentoria e visibilidade dentro de
              um dos principais parques tecnológicos do sul do Brasil.
            </p>
          </div>
        </section>

        <section className="py-16 container mx-auto px-4 max-w-5xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Pilares do programa</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <p.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          {/* Tabela resumo de pontuação */}
          <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <Coins className="size-4" /> Tabela Oficial de LigaCoins (LC)
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold">
              Por que Reuniões Liga UNI e Staff valem tantos pontos?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
              Comparecer às Reuniões Gerais da Liga UNI e atuar na linha de frente como Staff nos
              eventos do Ágora exigem comprometimento presencial da equipe. Por isso, são as
              atividades com maior retorno em LigaCoins para destravar prêmios na Loja de
              Benefícios:
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                <Megaphone className="size-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Reuniões Liga UNI (Destaque)</div>
                  <div className="text-xs text-amber-800 font-bold mt-0.5">
                    +{CREDITS_PER_MEETING_MEMBER} LC por representante +{" "}
                    {CREDITS_PER_MEETING_EVENT} LC por reunião
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                <HandHelping className="size-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Staff em Eventos do Ágora (Destaque)</div>
                  <div className="text-xs text-amber-800 font-bold mt-0.5">
                    +{CREDITS_PER_STAFF_MEMBER} LC por membro + {CREDITS_PER_STAFF_EVENT} LC por
                    evento
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-start gap-3">
                <Lightbulb className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Oferecer Oficina para outras equipes</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    +{CREDITS_PER_WORKSHOP_MEMBER} LC por ministrante +{" "}
                    {CREDITS_PER_PEER_WORKSHOP} LC (+{CREDITS_PER_JOINT_WORKSHOP_BONUS} LC em
                    conjunto)
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-start gap-3">
                <GraduationCap className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Participar de Capacitações UNI</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    +{CREDITS_PER_TRAINING_MEMBER} LC por membro inscrito +{" "}
                    {CREDITS_PER_TRAINING_EVENT} LC por evento
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <DoorOpen className="size-4 text-primary shrink-0" />
              <span>
                Reservas de salas em <strong>Reuniões de Equipe</strong> contam com 2 reservas
                gratuitas por mês para cada entidade.
              </span>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/50 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl font-bold">Sua equipe ainda não faz parte?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre sua conta de líder ou experimente a demonstração interativa.
              </p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                Começar agora <ArrowRight className="ml-1" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
