import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  ShieldCheck,
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
  REWARD_CATALOG,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/guia")({
  head: () => ({ meta: [{ title: "Guia do Administrador — Liga UNI" }] }),
  component: AdminGuiaPage,
});

function AdminGuiaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Como funciona o Painel do Administrador"
        description="Guia completo da Central de Aprovações em sub-abas horizontais, gestão de atividades e liberação de LigaCoins."
      />

      {/* Fluxo da Central de Aprovações em sub-abas */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <ShieldCheck className="size-4" /> Central de Aprovações em Sub-Abas Horizontais
        </div>
        <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold">
          Mesmo padrão organizado dos líderes, focado nas aprovações do Admin
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Ao clicar em <strong>Aprovações</strong> no menu lateral, você vê os cards das 6 frentes
          de aprovação e também pode navegar diretamente pelas sub-abas na barra lateral. Dentro de
          cada sub-aba, as solicitações aparecem em <strong>cards horizontais</strong> (uma embaixo
          da outra), com as pendentes no topo e o histórico já processado recolhido logo abaixo:
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <DoorOpen className="size-4 text-primary" /> 1. Reuniões de Equipe
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Aprove ou recuse pedidos de reserva de sala feitos pelas equipes para suas reuniões
              internas.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <Lightbulb className="size-4 text-primary" /> 2. Oficinas de Equipes
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Aprove a realização + sala da oficina proposta e, após o evento, clique em{" "}
              <strong>Liberar LC</strong> (+{CREDITS_PER_WORKSHOP_MEMBER} LC/min. +{" "}
              {CREDITS_PER_PEER_WORKSHOP} LC, e +{CREDITS_PER_JOINT_WORKSHOP_BONUS} LC se for em
              conjunto).
            </p>
          </div>
          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm text-amber-900">
              <HandHelping className="size-4 text-amber-700" /> 3. Staff em Eventos (Alta LC)
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Valide os voluntários que atuaram nos eventos do Ágora e libere{" "}
              <strong>
                +{CREDITS_PER_STAFF_MEMBER} LC/membro + {CREDITS_PER_STAFF_EVENT} LC
              </strong>
              .
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <GraduationCap className="size-4 text-primary" /> 4. Capacitações UNI
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Após ministrar uma Capacitação UNI, valide a presença das equipes inscritas para
              liberar +{CREDITS_PER_TRAINING_MEMBER} LC/membro + {CREDITS_PER_TRAINING_EVENT} LC.
            </p>
          </div>
          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm text-amber-900">
              <Megaphone className="size-4 text-amber-700" /> 5. Reuniões Liga UNI (Alta LC)
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Confirme a presença dos representantes nas reuniões gerais e libere{" "}
              <strong>
                +{CREDITS_PER_MEETING_MEMBER} LC/rep + {CREDITS_PER_MEETING_EVENT} LC
              </strong>
              .
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <Gift className="size-4 text-primary" /> 6. Prêmios LigaCoins
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Aprove ou recuse os pedidos de resgate de prêmios feitos pelas entidades na Loja de
              Benefícios.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="hero" size="sm" asChild>
            <Link to="/admin/aprovacoes">
              <ClipboardCheck className="size-4 mr-1" /> Abrir Central de Aprovações
            </Link>
          </Button>
        </div>
      </div>

      {/* Demais módulos do Admin */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Building2 className="size-4" /> Entidades & Cadastros
            </span>
            <h3 className="mt-2 font-display text-lg font-semibold">
              Aprove novos líderes e gerencie equipes
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Aprove solicitações de cadastro de novos líderes, cadastre ou edite entidades e
              visualize a lista completa de integrantes de cada projeto.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/entidades">
                Ir para Entidades <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Megaphone className="size-4" /> Reuniões, Capacitações & Staff
            </span>
            <h3 className="mt-2 font-display text-lg font-semibold">
              Convoque reuniões, capacitações e chamados de staff
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Sempre que você publica uma nova Reunião Liga UNI ou Capacitação UNI, os líderes com
              avisos por e-mail ativados são notificados automaticamente.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/reunioes">
                Reuniões <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/capacitacoes">
                Capacitações <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar className="size-4" /> Calendário (Modo Visualização)
            </span>
            <h3 className="mt-2 font-display text-lg font-semibold">
              Visão mensal de todas as salas e eventos
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Consulte todos os eventos e reservas em modo visualização e use o botão de atalho no
              modal para ir direto à página da atividade quando quiser editar.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/calendario">
                Abrir Calendário <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela de referência LigaCoins */}
      <div className="rounded-2xl border-2 border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
          <Coins className="size-4" /> Regra de Negócio Oficial — LigaCoins (LC)
        </div>
        <h2 className="font-display text-xl font-bold">
          Tabela de créditos automáticos e catálogo de resgates
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> Créditos liberados na aprovação:
            </div>
            <div className="flex justify-between">
              <span>Reuniões Liga UNI (por representante + bônus)</span>
              <CoinPerPersonTag
                perMember={CREDITS_PER_MEETING_MEMBER}
                perEvent={CREDITS_PER_MEETING_EVENT}
                className="text-amber-800"
              />
            </div>
            <div className="flex justify-between">
              <span>Staff em Eventos do Ágora (por membro + bônus)</span>
              <CoinPerPersonTag
                perMember={CREDITS_PER_STAFF_MEMBER}
                perEvent={CREDITS_PER_STAFF_EVENT}
                className="text-amber-800"
              />
            </div>
            <div className="flex justify-between">
              <span>Oferecer Oficina (+{CREDITS_PER_JOINT_WORKSHOP_BONUS} LC em conjunto)</span>
              <CoinPerPersonTag
                perMember={CREDITS_PER_WORKSHOP_MEMBER}
                perEvent={CREDITS_PER_PEER_WORKSHOP}
                className="text-amber-800"
              />
            </div>
            <div className="flex justify-between">
              <span>Capacitações UNI (por membro + bônus)</span>
              <CoinPerPersonTag
                perMember={CREDITS_PER_TRAINING_MEMBER}
                perEvent={CREDITS_PER_TRAINING_EVENT}
                className="text-amber-800"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Gift className="size-4 text-amber-700" /> Catálogo de Prêmios (Loja LigaCoins):
            </div>
            {REWARD_CATALOG.map((r) => (
              <div key={r.id} className="flex justify-between text-muted-foreground">
                <span className="truncate">{r.titulo}</span>
                <span className="font-semibold text-amber-800 shrink-0">{r.custo} LC</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
