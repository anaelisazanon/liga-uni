import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrMsg, errMsg, getMyRole } from "@/lib/auth";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_LEADER_EMAIL,
  DEMO_PASSWORD,
  DEMO_PENDING_LEADER_EMAIL,
  isDemoLoginEnabled,
} from "@/lib/demo";
import { ensureDemoUsers } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user) {
      try {
        const role = await getMyRole(user.id);
        throw redirect({ to: role === "admin" ? "/admin" : "/lider", replace: true });
      } catch (e) {
        if (e && typeof e === "object" && ("to" in e || "options" in e)) throw e;
        console.error(e);
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Entrar — Liga UNI · Ágora Tech Park" },
      {
        name: "description",
        content:
          "Acesse o Liga UNI, a conexão entre o programa Liga Ágora e projetos universitários no Ágora Tech Park.",
      },
      { property: "og:title", content: "Entrar — Liga UNI · Ágora Tech Park" },
      {
        property: "og:description",
        content:
          "Acesse o Liga UNI, a conexão entre o programa Liga Ágora e projetos universitários no Ágora Tech Park.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"entrar" | "cadastrar">("entrar");
  const [loading, setLoading] = useState(false);
  const [submittedPending, setSubmittedPending] = useState(false);

  // Campos de login e cadastro
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [faculdade, setFaculdade] = useState("");
  const [projeto, setProjeto] = useState("");
  const [descricao, setDescricao] = useState("");

  const showDemo = isDemoLoginEnabled();

  const routeByUser = async (userId: string) => {
    try {
      await qc.cancelQueries();
      qc.clear();
      const role = await getMyRole(userId);
      navigate({ to: role === "admin" ? "/admin" : "/lider", replace: true });
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error || !data.user) {
      toast.error(authErrMsg(error));
      return;
    }
    await routeByUser(data.user.id);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
        data: { nome, faculdade, projeto, descricao },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(authErrMsg(error));
      return;
    }
    setSubmittedPending(true);
    toast.success(
      "Solicitação de cadastro enviada! O administrador irá analisar os dados do seu projeto.",
    );
  };

  const signInDemo = async (targetEmail: string) => {
    setLoading(true);
    try {
      await ensureDemoUsers();
    } catch {
      // Continua normalmente caso o servidor não tenha SUPABASE_SERVICE_ROLE_KEY
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: DEMO_PASSWORD,
    });
    setLoading(false);
    if (error || !data.user) {
      toast.error(authErrMsg(error));
      return;
    }
    toast.success(
      targetEmail === DEMO_ADMIN_EMAIL
        ? "Acesso de Administrador liberado!"
        : "Acesso de Líder liberado!",
    );
    await routeByUser(data.user.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Topo com Identidade Liga UNI */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            Liga UNI · Ágora Tech Park
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Portal Liga <span className="text-primary">UNI</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesse o painel da sua equipe universitária ou a administração do Ágora Tech Park
          </p>
        </div>

        {/* BLOCO GRANDE E CHAMATIVO NO TOPO: ACESSO RÁPIDO DE DEMONSTRAÇÃO */}
        {showDemo && (
          <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                    Acesso Rápido · 1 Clique
                  </span>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-tight">
                    Entrar no Modo Demonstração
                  </h2>
                </div>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Clique em um perfil abaixo para testar
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Botão 1: Líder GERM */}
              <button
                type="button"
                disabled={loading}
                onClick={() => signInDemo(DEMO_LEADER_EMAIL)}
                className="group flex flex-col justify-between rounded-xl border-2 border-primary bg-primary p-4 text-left text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-bold">
                    <UserCheck className="h-5 w-5 shrink-0" />
                    Líder — GERM (UDESC)
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                </div>
                <p className="mt-1.5 text-xs opacity-90">
                  Entrar como líder do GERM · Atividades, Salas e LigaCoins
                </p>
              </button>

              {/* Botão 2: Administrador */}
              <button
                type="button"
                disabled={loading}
                onClick={() => signInDemo(DEMO_ADMIN_EMAIL)}
                className="group flex flex-col justify-between rounded-xl border-2 border-foreground/20 bg-card p-4 text-left text-foreground shadow-sm transition hover:border-primary hover:bg-secondary/60 disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-bold text-primary">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    Administrador do Ágora
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition group-hover:translate-x-1" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Central de Aprovações, Entidades e Alertas Semestrais
                </p>
              </button>
            </div>

            {/* Botão 3: Líder Fictício com Pendências Semestrais */}
            <button
              type="button"
              disabled={loading}
              onClick={() => signInDemo(DEMO_PENDING_LEADER_EMAIL)}
              className="group flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border-2 border-destructive/45 bg-destructive/10 px-4 py-3 text-left transition hover:border-destructive hover:bg-destructive/15 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground font-bold">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-destructive">
                    Teste de Exigências Pendentes — Grupo Quasar (UDESC · Fictício)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Simula equipe que cumpriu apenas 1/4 das exigências semestrais (gera alerta ! no
                    Admin)
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive shrink-0">
                Testar perfil <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        )}

        {/* Formulário tradicional de Login / Novo Cadastro */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar com E-mail e Senha</TabsTrigger>
              <TabsTrigger value="cadastrar" onClick={() => setSubmittedPending(false)}>
                Solicitar Cadastro de Projeto
              </TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <Field label="E-mail institucional ou de acesso">
                  <Input
                    type="email"
                    required
                    placeholder="lider@universidade.edu.br ou admin@agora.tech"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Senha">
                  <Input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </Field>
                <Button className="w-full" disabled={loading}>
                  Entrar no portal
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  O sistema identifica automaticamente se seu perfil é de <b>Líder de Equipe</b> ou{" "}
                  <b>Administrador</b>.
                </p>
              </form>
            </TabsContent>
            <TabsContent value="cadastrar">
              {submittedPending ? (
                <div className="mt-4 rounded-xl border bg-card p-6 text-center shadow-card">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                  <h3 className="mt-3 text-lg font-semibold">Cadastro enviado para aprovação!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Os dados do líder (<b>{nome}</b>) e do projeto <b>{projeto}</b> ({faculdade})
                    foram enviados para o administrador do Ágora. Assim que o administrador aprovar,
                    seu acesso será liberado para login com <b>{email}</b>.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 w-full"
                    onClick={() => {
                      setSubmittedPending(false);
                      setTab("entrar");
                    }}
                  >
                    Voltar para tela de login
                  </Button>
                </div>
              ) : (
                <form onSubmit={signUp} className="mt-4 space-y-3.5">
                  <Field label="Nome do líder">
                    <Input
                      required
                      placeholder="Ex.: Ana Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="E-mail">
                      <Input
                        type="email"
                        required
                        placeholder="lider@universidade.edu.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field label="Senha">
                      <Input
                        type="password"
                        minLength={6}
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Faculdade / Universidade">
                      <Input
                        required
                        placeholder="UDESC, UFSC, IFSC ou Univille"
                        value={faculdade}
                        onChange={(e) => setFaculdade(e.target.value)}
                      />
                    </Field>
                    <Field label="Nome do projeto / entidade">
                      <Input
                        required
                        placeholder="Ex.: Equipe de Robótica, Baja..."
                        value={projeto}
                        onChange={(e) => setProjeto(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Descrição do projeto">
                    <Textarea
                      required
                      rows={3}
                      placeholder="Descreva os objetivos, área de atuação e missão do projeto..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </Field>
                  <Button className="w-full" disabled={loading}>
                    Enviar cadastro para aprovação
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
