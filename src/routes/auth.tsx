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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Coluna lateral esquerda limpa e institucional (como era originalmente) */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-hero text-primary-foreground p-12">
        <div className="font-display text-2xl font-bold tracking-tight">
          Liga <span className="text-accent">UNI</span> · Ágora Tech Park
        </div>

        <div className="space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            Joinville · UDESC · UFSC · IFSC · Univille
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight">
            Conectando projetos universitários ao ecossistema de inovação do Ágora.
          </h2>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Gerencie sua equipe, agende salas e auditórios, acumule LigaCoins em capacitações,
            oficinas e eventos de staff e troque por benefícios exclusivos.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Liga UNI</p>
      </div>

      {/* Coluna direita com Acesso Rápido de Demonstração no topo e Login limpo */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div>
            <div className="lg:hidden mb-2 font-display text-xl font-bold text-foreground">
              Liga <span className="text-primary">UNI</span> · Ágora Tech Park
            </div>
            <h1 className="font-display text-2xl font-bold">Acesse o Liga UNI</h1>
            <p className="text-sm text-muted-foreground">
              Entre com sua conta ou utilize o acesso rápido de demonstração abaixo
            </p>
          </div>

          {/* Acesso Rápido de Demonstração no topo, limpo e visível */}
          {showDemo && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Acesso Rápido de Demonstração
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">1 clique</span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => signInDemo(DEMO_LEADER_EMAIL)}
                  className="group flex items-center justify-between gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-left text-primary-foreground shadow-2xs transition hover:opacity-95 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Líder — GERM</span>
                    </div>
                    <div className="text-[10px] opacity-85 truncate">UDESC Joinville</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => signInDemo(DEMO_ADMIN_EMAIL)}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-foreground shadow-2xs transition hover:border-primary/50 hover:bg-secondary/60 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Administrador</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      Gestão Ágora Tech Park
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary transition group-hover:translate-x-0.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => signInDemo(DEMO_PENDING_LEADER_EMAIL)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-xs transition hover:border-amber-500/70 hover:bg-amber-500/15 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>
                    Testar equipe c/ pendências: <b>Grupo Quasar (UDESC)</b>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-700 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar" onClick={() => setSubmittedPending(false)}>
                Novo cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={signIn} className="mt-4 space-y-4">
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
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </Field>
                <Button className="w-full" disabled={loading}>
                  Entrar
                </Button>
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
