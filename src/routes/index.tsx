import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  DoorOpen,
  Gift,
  HandHelping,
  Lightbulb,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
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
  CREDITS_WELCOME,
} from "@/lib/data";

export const Route = createFileRoute("/")({
  component: Index,
});

const features = [
  {
    icon: Megaphone,
    title: "Reuniões Liga UNI (Alta Pontuação)",
    badge: `+${CREDITS_PER_MEETING_MEMBER} LC/rep + ${CREDITS_PER_MEETING_EVENT} LC`,
    description:
      "Compareça às reuniões gerais convocadas pela coordenação com representantes da equipe e receba a maior bonificação de LigaCoins.",
  },
  {
    icon: HandHelping,
    title: "Staff em Eventos do Ágora (Alta Pontuação)",
    badge: `+${CREDITS_PER_STAFF_MEMBER} LC/membro + ${CREDITS_PER_STAFF_EVENT} LC`,
    description:
      "Apoie eventos oficiais do ecossistema Ágora Tech Park como staff e acumule muitos pontos para trocar por prêmios exclusivos.",
  },
  {
    icon: Lightbulb,
    title: "Oferecer Oficina & Capacitações UNI",
    badge: `Até +${CREDITS_PER_PEER_WORKSHOP + CREDITS_PER_JOINT_WORKSHOP_BONUS} LC bônus`,
    description:
      "Ministre oficinas para outras equipes (com bônus em conjunto) ou inscreva seus membros nas Capacitações UNI em Atividades & Salas.",
  },
  {
    icon: DoorOpen,
    title: "Reuniões de Equipe & Loja LigaCoins",
    badge: "Salas + Prêmios",
    description:
      "Reserve salas do Ágora na sub-aba Reuniões de Equipe e troque seu saldo de LigaCoins por kits, mentorias, estandes e coffee break.",
  },
];

const steps = [
  {
    n: "01",
    title: "Cadastre sua equipe",
    text: `O líder cria a conta e cadastra a entidade ou projeto estudantil, recebendo +${CREDITS_WELCOME} LigaCoins de boas-vindas na aprovação.`,
  },
  {
    n: "02",
    title: "Acesse Atividades & Salas",
    text: "Tudo organizado em sub-abas: Capacitações UNI, Staff, Oferecer Oficina e Reuniões de Equipe (reserva de salas).",
  },
  {
    n: "03",
    title: "Some muitos pontos em Staff e Reuniões",
    text: `Ir às Reuniões Liga UNI (+${CREDITS_PER_MEETING_MEMBER} LC/pessoa + ${CREDITS_PER_MEETING_EVENT} LC) e atuar como Staff (+${CREDITS_PER_STAFF_MEMBER} LC/pessoa + ${CREDITS_PER_STAFF_EVENT} LC) garantem alta pontuação para resgatar prêmios.`,
  },
];

function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-liga-uni.png" alt="Liga UNI" className="h-9 w-9 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-tight">Liga UNI</span>
              <span className="text-[11px] text-muted-foreground">Ágora Tech Park</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Como funciona
            </a>
            <a href="#recursos" className="hover:text-foreground transition-colors">
              Atividades & Moedas
            </a>
            <Link to="/sobre" className="hover:text-foreground transition-colors">
              Sobre o projeto
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">
                Acessar portal <ArrowRight className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(195 95% 60% / 0.35), transparent 40%), radial-gradient(circle at 80% 70%, hsl(258 80% 62% / 0.35), transparent 45%)",
          }}
        />
        <div className="container mx-auto relative px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1 text-xs font-medium backdrop-blur-sm mb-6">
              <Sparkles className="size-3.5 text-accent" />
              Ecossistema Universitário · Ágora Tech Park
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-[1.08]">
              Conectando equipes universitárias ao coração da inovação.
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
              O portal oficial da <strong>Liga UNI</strong> para participar de Reuniões Gerais,
              inscrever sua equipe em Capacitações UNI e Staff, oferecer Oficinas, reservar salas
              do Ágora e trocar <strong>LigaCoins</strong> por prêmios e benefícios reais.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/auth">
                  Entrar como Líder ou Admin <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                asChild
              >
                <Link to="/sobre">Conhecer a Liga UNI</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-primary-foreground/15 text-sm">
              <div>
                <div className="font-display text-2xl font-bold">
                  +{CREDITS_PER_MEETING_MEMBER} LC
                </div>
                <div className="text-primary-foreground/70">
                  por pessoa + {CREDITS_PER_MEETING_EVENT} LC em Reuniões UNI
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">
                  +{CREDITS_PER_STAFF_MEMBER} LC
                </div>
                <div className="text-primary-foreground/70">
                  por membro + {CREDITS_PER_STAFF_EVENT} LC como Staff
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">
                  +{CREDITS_PER_WORKSHOP_MEMBER} LC
                </div>
                <div className="text-primary-foreground/70">
                  por ministrante + {CREDITS_PER_PEER_WORKSHOP} LC em Oficinas
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">
                  +{CREDITS_PER_TRAINING_MEMBER} LC
                </div>
                <div className="text-primary-foreground/70">
                  por membro + {CREDITS_PER_TRAINING_EVENT} LC em Capacitações
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Atividades & Salas + LigaCoins
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Quanto maior o engajamento da equipe, melhores os prêmios
          </h2>
          <p className="mt-3 text-muted-foreground">
            Todas as atividades ficam organizadas em sub-abas claras para os líderes e em uma
            Central de Aprovações horizontal por categoria para a coordenação.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="size-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
                    <Coins className="size-3" /> {f.badge}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Fluxo simples
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Como funciona o acesso
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="relative rounded-xl bg-card p-6 border border-border shadow-card"
              >
                <span className="font-display text-4xl font-bold text-accent/30">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles CTA */}
      <section className="py-20 container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Users className="size-3.5" /> Para Líderes de Equipe
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">
                Gerencie sua equipe em Atividades & Salas
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" /> Confirme presença nas
                  Reuniões Liga UNI (+{CREDITS_PER_MEETING_MEMBER} LC/rep +{" "}
                  {CREDITS_PER_MEETING_EVENT} LC)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" /> Sub-abas unificadas:
                  Capacitações UNI, Staff (+{CREDITS_PER_STAFF_MEMBER} LC/membro +{" "}
                  {CREDITS_PER_STAFF_EVENT} LC), Oferecer Oficina e Reuniões de Equipe
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" /> Troque LigaCoins na
                  Loja de Benefícios e acompanhe o Calendário em modo visualização
                </li>
              </ul>
            </div>
            <Button variant="default" className="mt-6 self-start" asChild>
              <Link to="/auth">
                Acessar como Líder <ArrowRight className="ml-1" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-hero text-primary-foreground p-8 shadow-elevated flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="size-3.5 text-accent" /> Administração Liga UNI
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">
                Central de Aprovações horizontal por atividade
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/85">
                <li className="flex items-center gap-2">
                  <Calendar className="size-4 text-accent shrink-0" /> Aprove em sub-abas:
                  Reuniões de Equipe, Oficinas, Staff, Capacitações, Reuniões UNI e Prêmios
                </li>
                <li className="flex items-center gap-2">
                  <Gift className="size-4 text-accent shrink-0" /> Libere LigaCoins em 1 clique
                  após os eventos e valide resgates da Loja de Benefícios
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="size-4 text-accent shrink-0" /> Gerencie entidades,
                  reuniões gerais, capacitações, chamados de staff e calendário
                </li>
              </ul>
            </div>
            <Button variant="accent" className="mt-6 self-start" asChild>
              <Link to="/auth">
                Entrar na Administração <ArrowRight className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo-liga-uni.png" alt="Liga UNI" className="h-5 w-5 object-contain" />
            <span>Liga UNI · Ágora Tech Park — Joinville, SC</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sobre" className="hover:text-foreground">
              Sobre
            </Link>
            <Link to="/auth" className="hover:text-foreground">
              Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
