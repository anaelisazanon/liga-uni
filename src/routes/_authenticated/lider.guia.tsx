import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  HelpCircle,
  Lightbulb,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";
import { CoinPerPersonTag, PageHeader } from "@/components/AppShell";
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
  REWARD_CATALOG,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lider/guia")({
  head: () => ({ meta: [{ title: "Como funciona o Portal — Liga UNI" }] }),
  component: LiderGuiaPage,
});

function LiderGuiaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Como funciona o Portal do Líder"
        description="Guia rápido do novo padrão de Atividades & Salas em sub-abas, exigências semestrais de permanência, alta pontuação em Staff e Reuniões Liga UNI e Loja de Benefícios."
      />

      {/* Exigências Semestrais de Permanência */}
      <div className="rounded-2xl border-2 border-destructive/35 bg-destructive/5 p-6 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
          <HelpCircle className="size-4" /> Exigências Semestrais de Permanência (Renova todo
          semestre)
        </div>
        <h2 className="mt-1 font-display text-xl font-bold">
          4 metas obrigatórias por semestre para continuar na Liga UNI
        </h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-3xl">
          Na barra lateral (abaixo das suas LigaCoins) e no topo do Painel do Líder você acompanha
          em tempo real quantas exigências já cumpriu e quantas faltam. Caso alguma equipe não
          cumpra até o fim do semestre, o Administrador recebe um alerta (<strong>!</strong>):
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="font-semibold text-foreground">1. Reuniões Liga UNI</div>
            <div className="mt-1 text-muted-foreground">
              Presença obrigatória em <strong>todas</strong> as reuniões gerais do semestre.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="font-semibold text-foreground">2. Staff em Eventos</div>
            <div className="mt-1 text-muted-foreground">
              Ajudar como staff em pelo menos <strong>2 eventos</strong> do Ágora no semestre.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="font-semibold text-foreground">3. Capacitações UNI</div>
            <div className="mt-1 text-muted-foreground">
              Participar de pelo menos <strong>2 capacitações</strong> oficiais no semestre.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="font-semibold text-foreground">4. Oferecer Oficina</div>
            <div className="mt-1 text-muted-foreground">
              Ministrar pelo menos <strong>1 oficina</strong> para outras equipes no semestre.
            </div>
          </div>
        </div>
      </div>

      {/* Visão geral em 3 passos */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="size-4" /> Visão Geral da Plataforma
        </div>
        <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold">
          Sua equipe conectada ao Ágora Tech Park em 3 passos
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <span className="font-display text-2xl font-bold text-primary">01</span>
            <h3 className="mt-2 font-display font-semibold">Cadastre os membros na Equipe</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Clique no <strong>nome do seu projeto</strong> no menu lateral para gerenciar os
              membros da equipe e ativar/desativar avisos automáticos por e-mail.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <span className="font-display text-2xl font-bold text-primary">02</span>
            <h3 className="mt-2 font-display font-semibold">
              Use Atividades & Salas (em sub-abas) + Reuniões UNI
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Todas as atividades ficam divididas em sub-abas no menu lateral: Capacitações UNI,
              Staff, Oferecer Oficina e Reuniões de Equipe (reservas de sala).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <span className="font-display text-2xl font-bold text-primary">03</span>
            <h3 className="mt-2 font-display font-semibold">
              Foque em Staff e Reuniões Liga UNI para ganhar muitos pontos
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Ser <strong>Staff</strong> e ir às <strong>Reuniões Liga UNI</strong> valem a maior
              quantidade de LigaCoins para destravar prêmios exclusivos na Loja de Benefícios.
            </p>
          </div>
        </div>
      </div>

      {/* Estrutura de Atividades & Salas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h2 className="font-display text-xl font-bold">
            O novo padrão: Atividades & Salas em sub-abas
          </h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Ao clicar em <strong>Atividades & Salas</strong> no menu lateral, você vê os 4 cards de
          acesso rápido com a explicação de cada frente e também pode alternar diretamente pelas
          sub-abas:
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <GraduationCap className="size-4" /> Sub-aba 1 · Capacitações UNI
                </span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_TRAINING_MEMBER}
                  perEvent={CREDITS_PER_TRAINING_EVENT}
                  className="text-xs text-amber-800"
                />
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">
                Workshops e treinamentos da coordenação
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Treinamentos oficiais da Liga UNI. Selecione os membros da sua equipe que irão
                participar; enquanto o evento não ocorre, o card fica marcado como{" "}
                <strong>Inscrito</strong>. Após o evento, o Admin valida a presença e libera os
                pontos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lider/capacitacoes" search={{ tab: "capacitacoes" }}>
                  Abrir Capacitações UNI <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                  <HandHelping className="size-4" /> Sub-aba 2 · Staff (Alta Pontuação!)
                </span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_STAFF_MEMBER}
                  perEvent={CREDITS_PER_STAFF_EVENT}
                  className="text-xs text-amber-800"
                />
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">
                Apoio e Staff em Eventos do Ágora
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Como atuar no staff exige dedicação presencial nos eventos do Ágora Tech Park, essa
                atividade rende <strong>muitos pontos</strong> (+{CREDITS_PER_STAFF_MEMBER} LC por
                membro escalado + {CREDITS_PER_STAFF_EVENT} LC de bônus por evento).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-500/20 flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lider/capacitacoes" search={{ tab: "staff" }}>
                  Abrir Staff <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Lightbulb className="size-4" /> Sub-aba 3 · Oferecer Oficina
                </span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_WORKSHOP_MEMBER}
                  perEvent={CREDITS_PER_PEER_WORKSHOP}
                  className="text-xs text-amber-800"
                />
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">
                Oficinas ministradas pela sua equipe (+ reserva de sala)
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Proponha uma oficina prática para outras entidades, escolha a sala do Ágora e
                selecione os ministrantes. Se for realizada{" "}
                <strong>em conjunto com outro projeto</strong>, sua equipe recebe{" "}
                <strong>+{CREDITS_PER_JOINT_WORKSHOP_BONUS} LC extras</strong>!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lider/capacitacoes" search={{ tab: "oficinas" }}>
                  Abrir Oferecer Oficina <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <DoorOpen className="size-4" /> Sub-aba 4 · Reuniões de Equipe
                </span>
                <span className="text-xs font-semibold text-success">2 grátis/mês</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">
                Reserva de salas para trabalho interno da equipe
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Precisa reunir sua diretoria ou projeto? Solicite salas de reunião ou laboratório
                do Ágora Tech Park nesta sub-aba.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lider/capacitacoes" search={{ tab: "reunioes-equipe" }}>
                  Abrir Reuniões de Equipe <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demais abas do menu */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                <Megaphone className="size-4" /> Reuniões Liga UNI (Alta Pontuação!)
              </span>
            </div>
            <h3 className="mt-2 font-display text-base font-semibold">
              +{CREDITS_PER_MEETING_MEMBER} LC/rep + {CREDITS_PER_MEETING_EVENT} LC
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Reuniões gerais presenciais convocadas pela coordenação. Comparecer com
              representantes da equipe garante uma das maiores pontuações do portal!
            </p>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 self-end" asChild>
            <Link to="/lider/reunioes">
              Ir para Reuniões UNI <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar className="size-4" /> Calendário (Modo Visualização)
            </span>
            <h3 className="mt-2 font-display text-base font-semibold">
              Agenda unificada com selo de Inscrito
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              O calendário opera em modo somente leitura para evitar edições acidentais. Ao clicar
              em qualquer evento, há um botão direto para a página da respectiva atividade.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 self-end" asChild>
            <Link to="/lider/calendario">
              Ir para Calendário <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Users className="size-4" /> Minha Equipe & Avisos por E-mail
            </span>
            <h3 className="mt-2 font-display text-base font-semibold">
              Clique no nome do projeto no menu
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Cadastre os integrantes da equipe e ative ou desative o recebimento de avisos por
              e-mail quando surgirem novas Reuniões UNI, Capacitações ou Oficinas.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 self-end" asChild>
            <Link to="/lider/equipe">
              Configurar Equipe <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabela completa de LigaCoins + Catálogo recalibrado */}
      <div className="rounded-2xl border-2 border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 shadow-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
              <Coins className="size-4" /> Tabela Recalibrada de LigaCoins (LC)
            </span>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold">
              Pontuação por atividade e prêmios da Loja de Benefícios
            </h2>
          </div>
          <Button variant="default" size="sm" asChild>
            <Link to="/lider/ligacoins">
              <Gift className="size-4 mr-1" /> Abrir Loja LigaCoins
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Como ganhar LigaCoins
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center justify-between gap-2">
                <span>Boas-vindas da entidade na Liga UNI</span>
                <span className="font-bold text-amber-800">+{CREDITS_WELCOME} LC</span>
              </li>
              <li className="flex items-center justify-between gap-2 font-semibold text-foreground">
                <span>Reuniões Gerais da Liga UNI (Destaque!)</span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_MEETING_MEMBER}
                  perEvent={CREDITS_PER_MEETING_EVENT}
                  className="text-amber-800"
                />
              </li>
              <li className="flex items-center justify-between gap-2 font-semibold text-foreground">
                <span>Staff em Eventos do Ágora (Destaque!)</span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_STAFF_MEMBER}
                  perEvent={CREDITS_PER_STAFF_EVENT}
                  className="text-amber-800"
                />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Oferecer Oficina (+{CREDITS_PER_JOINT_WORKSHOP_BONUS} LC em conjunto)</span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_WORKSHOP_MEMBER}
                  perEvent={CREDITS_PER_PEER_WORKSHOP}
                  className="text-amber-800"
                />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Participar de Capacitações UNI</span>
                <CoinPerPersonTag
                  perMember={CREDITS_PER_TRAINING_MEMBER}
                  perEvent={CREDITS_PER_TRAINING_EVENT}
                  className="text-amber-800"
                />
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Gift className="size-4" /> Prêmios da Loja de Benefícios (Recalibrados)
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {REWARD_CATALOG.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{r.titulo}</span>
                  <span className="font-semibold text-amber-800 shrink-0">{r.custo} LC</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/90 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
          <HelpCircle className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong>Importante:</strong> Quando sua equipe se inscreve em uma atividade futura, o
            card fica destacado com o selo <strong>✓ Inscrito</strong>. As LigaCoins só aparecem
            como <strong>creditadas</strong> depois que o evento acontece e o Administrador valida
            a presença na Central de Aprovações.
          </div>
        </div>
      </div>
    </div>
  );
}
