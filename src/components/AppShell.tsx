import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Coins,
  HelpCircle,
  LogOut,
  Pencil,
  Send,
  User,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  adminMessagesQuery,
  CHAMADO_TOPICOS,
  type SemesterRequirementsSummary,
} from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/auth";

export type NavChildItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  search?: Record<string, string>;
  count?: number;
  isActive?: boolean;
};

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  count?: number;
  search?: Record<string, string>;
  isActive?: boolean;
  children?: NavChildItem[];
};

export function AppShell({
  nav,
  badge,
  subtitle,
  subtitleTo,
  coinsBalance,
  coinsPending,
  coinsTo,
  semesterRequirements,
  adminSemesterAlertsCount,
  guideTo,
  contactEntityId,
  children,
}: {
  nav: NavItem[];
  badge: string;
  subtitle?: string;
  subtitleTo?: string;
  coinsBalance?: number;
  coinsPending?: number;
  coinsTo?: string;
  semesterRequirements?: SemesterRequirementsSummary;
  adminSemesterAlertsCount?: number;
  guideTo?: string;
  contactEntityId?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const isAdminBadge = badge.toLowerCase().includes("admin");

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    await navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="flex flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64">
        <div className="px-6 py-5">
          <div className="font-display text-xl font-bold">
            Liga <span className="text-sidebar-primary">UNI</span>
          </div>
          <span className="mt-2.5 inline-block rounded-full bg-sidebar-primary px-2.5 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
            {badge}
          </span>
          {subtitle &&
            (subtitleTo ? (
              <Link
                to={subtitleTo}
                title="Clique para editar dados do projeto, avisos por e-mail e membros"
                className="group mt-2 flex items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs font-medium transition hover:bg-sidebar-accent"
              >
                <span className="line-clamp-2 leading-snug">{subtitle}</span>
                <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
              </Link>
            ) : (
              <p className="mt-2 truncate text-sm opacity-80">{subtitle}</p>
            ))}

          {typeof coinsBalance === "number" && (
            <Link
              to={coinsTo ?? "/lider/ligacoins"}
              title="Clique para abrir a Central LigaCoins (Como funciona, Benefícios, Ranking, Entradas e Saídas)"
              className="group mt-2 block rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs transition hover:border-emerald-400/70 hover:bg-emerald-500/25"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                  <Coins className="h-3.5 w-3.5" /> LigaCoins
                </span>
                <span className="inline-flex items-center gap-0.5 font-display text-sm font-bold text-emerald-300">
                  {coinsBalance} LC
                  <ChevronRight className="h-3.5 w-3.5 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
              </div>
              {typeof coinsPending === "number" && coinsPending > 0 ? (
                <div className="mt-1 text-[11px] text-emerald-100/85">
                  +{coinsPending} LC aguardando pós-evento
                </div>
              ) : (
                <div className="mt-0.5 text-[11px] text-emerald-100/80">
                  Benefícios, Ranking e Extrato
                </div>
              )}
            </Link>
          )}

          {/* Card pequeno de Exigências Semestrais logo abaixo das moedas (em amarelo/âmbar suave, clicável para ver detalhes) */}
          {semesterRequirements && (
            <Link
              to="/lider/exigencias"
              title="Clique para ver os detalhes das exigências semestrais da Liga UNI"
              className={
                semesterRequirements.isCompliant
                  ? "group mt-2 block rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs transition hover:bg-emerald-500/25"
                  : "group mt-2 block rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-xs transition hover:border-amber-300/70 hover:bg-amber-400/25"
              }
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={
                    semesterRequirements.isCompliant
                      ? "inline-flex items-center gap-1.5 font-semibold text-emerald-300"
                      : "inline-flex items-center gap-1.5 font-semibold text-amber-200"
                  }
                >
                  {semesterRequirements.isCompliant ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  )}
                  <span>
                    {semesterRequirements.fulfilledCount}/{semesterRequirements.totalRequirements}{" "}
                    exigências semestrais
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amber-200 opacity-75 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
              <div
                className={
                  semesterRequirements.isCompliant
                    ? "mt-0.5 text-[10px] text-emerald-200/85"
                    : "mt-0.5 text-[10px] text-amber-100/80"
                }
              >
                {semesterRequirements.isCompliant
                  ? `Semestre ${semesterRequirements.semesterLabel} concluído · Ver detalhes`
                  : `Clique para ver detalhes (${semesterRequirements.semesterLabel})`}
              </div>
            </Link>
          )}

          {/* Card de aviso ! para o Admin quando há equipes com exigências semestrais pendentes */}
          {isAdminBadge &&
            typeof adminSemesterAlertsCount === "number" &&
            adminSemesterAlertsCount > 0 && (
              <Link
                to="/admin/pendencias-semestrais"
                title="Equipes que ainda não cumpriram as exigências semestrais da Liga UNI"
                className="group mt-2 block rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-2 text-xs transition hover:border-red-400/80 hover:bg-red-500/30"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1.5 font-bold text-red-200">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white">
                      !
                    </span>
                    <span>Equipes com exigências pendentes: {adminSemesterAlertsCount}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-red-200 opacity-75" />
                </div>
                <div className="mt-0.5 text-[10px] text-red-200/90">
                  Ver alerta de permanência semestral
                </div>
              </Link>
            )}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto">
          {nav.map((n) => (
            <div key={n.to + n.label} className="space-y-1">
              <Link
                to={n.to}
                search={n.search}
                activeOptions={{ exact: !!n.exact }}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-sidebar-accent hover:opacity-100 ${
                  n.isActive ? "bg-sidebar-accent font-semibold opacity-100" : "opacity-80"
                }`}
                activeProps={
                  n.isActive === undefined
                    ? { className: "bg-sidebar-accent !opacity-100 font-semibold" }
                    : undefined
                }
              >
                <n.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{n.label}</span>
                {typeof n.count === "number" && n.count > 0 && (
                  <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-bold text-sidebar-primary-foreground">
                    {n.count}
                  </span>
                )}
              </Link>

              {n.children && n.children.length > 0 && (
                <div className="hidden space-y-0.5 border-l border-sidebar-border/60 pl-3 ml-5 md:block">
                  {n.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to}
                      search={c.search}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition hover:bg-sidebar-accent hover:opacity-100 ${
                        c.isActive
                          ? "bg-sidebar-accent font-semibold text-sidebar-primary opacity-100"
                          : "opacity-75"
                      }`}
                    >
                      <c.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{c.label}</span>
                      {typeof c.count === "number" && c.count > 0 && (
                        <span className="rounded-full bg-sidebar-primary/25 px-1.5 py-0.2 text-[10px] font-bold text-sidebar-primary">
                          {c.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-1.5 p-3">
          {guideTo && (
            <Link
              to={guideTo}
              className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-semibold border-sidebar-primary" }}
            >
              <BookOpen className="h-4 w-4 text-sidebar-primary" />
              <span className="flex-1 text-left">Como funciona o site</span>
            </Link>
          )}
          {contactEntityId && <ContactAdminDialog entityId={contactEntityId} />}
          <button
            onClick={signOut}
            className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent md:flex"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <div className="mb-4 flex items-center justify-end md:hidden">
          <button onClick={signOut} className="text-sm text-muted-foreground underline">
            Sair
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}

function ContactAdminDialog({ entityId }: { entityId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [topico, setTopico] = useState<string>(CHAMADO_TOPICOS[0]);
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const { data: messages = [] } = useQuery(adminMessagesQuery(entityId));

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_messages").insert({
        entity_id: entityId,
        topico,
        assunto,
        mensagem,
        status: "pending",
        resposta: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAssunto("");
      setMensagem("");
      toast.success("Chamado enviado para a administração do Ágora!");
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
        >
          <HelpCircle className="h-4 w-4 text-sidebar-primary" />
          <span className="flex-1 text-left">Falar com o Admin</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir Chamado com o Administrador (Ágora)</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Tópico / Categoria</Label>
            <Select value={topico} onValueChange={setTopico}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tópico" />
              </SelectTrigger>
              <SelectContent>
                {CHAMADO_TOPICOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              required
              placeholder="Ex.: Dúvida sobre equipamentos do Auditório"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Texto da mensagem</Label>
            <Textarea
              required
              rows={3}
              placeholder="Descreva sua dúvida ou solicitação para a equipe do Ágora..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={send.isPending}>
            <Send className="mr-1.5 h-4 w-4" /> Enviar chamado
          </Button>
        </form>

        {messages.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Seus chamados recentes
            </div>
            <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1 text-xs">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {m.topico || "Geral"}
                      </span>
                      <span className="font-semibold text-foreground">{m.assunto}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.status === "answered"
                          ? "bg-success/15 text-success"
                          : "bg-warning/20 text-warning-foreground"
                      }`}
                    >
                      {m.status === "answered" ? "Respondido" : "Aguardando resposta"}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{m.mensagem}</p>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {fmtDateTime(m.created_at)}
                  </div>
                  {m.resposta && (
                    <div className="mt-2 flex items-start gap-1.5 rounded bg-primary/10 p-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div>
                        <b>Resposta do Admin:</b> {m.resposta}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact visual representation of "+N [coin]/[person] (+M)" instead of "+N LC/membro"
 */
export function CoinPerPersonTag({
  perMember,
  perEvent,
  className = "",
}: {
  perMember: number;
  perEvent?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${className}`}>
      <span>+{perMember}</span>
      <Coins className="h-3.5 w-3.5 shrink-0" />
      <span className="opacity-60">/</span>
      <User className="h-3.5 w-3.5 shrink-0" />
      {typeof perEvent === "number" && perEvent > 0 && (
        <span className="ml-0.5 inline-flex items-center gap-0.5 opacity-90">
          (+{perEvent} <Coins className="h-3 w-3 shrink-0" />)
        </span>
      )}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

const statusMap = {
  pending: { label: "Pendente", cls: "bg-warning/20 text-warning-foreground" },
  approved: { label: "Aprovada", cls: "bg-success/15 text-success" },
  rejected: { label: "Recusada", cls: "bg-destructive/15 text-destructive" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusMap }) {
  const s = statusMap[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 shadow-card ${className}`}>{children}</div>;
}
