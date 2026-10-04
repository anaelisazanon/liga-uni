import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrMsg, errMsg, getMyRole } from "@/lib/auth";
import { DEMO_ADMIN_EMAIL, DEMO_LEADER_EMAIL, DEMO_PASSWORD, isDemoLoginEnabled } from "@/lib/demo";
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
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/sobre" className="font-display text-xl font-bold">
          Liga <span className="text-accent">UNI</span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Projetos universitários conectados ao Ágora Tech Park.
          </h2>
          <p className="max-w-md text-sm leading-relaxed opacity-85">
            O Liga UNI une o programa voluntário Liga Ágora aos projetos universitários em
            Joinville, promovendo capacitações, eventos, hackathons, convívio entre equipes e uso
            integrado das salas do Ágora.
          </p>
        </div>
        <div className="flex items-center justify-between text-sm opacity-80">
          <span>Liga UNI · Ágora Tech Park</span>
          <Link to="/sobre" className="underline hover:opacity-100">
            Conheça o Liga UNI
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold">Bem-vindo ao Liga UNI</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Entre ou solicite o cadastro do seu projeto universitário para aprovação do Ágora.
          </p>

          {showDemo && (
            <div className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                Acesso rápido (apenas para testes)
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Clique em um botão abaixo para entrar direto sem precisar digitar senha:
              </p>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="w-full justify-start"
                  disabled={loading}
                  onClick={() => signInDemo(DEMO_LEADER_EMAIL)}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Entrar como Líder — GERM UDESC (teste)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-start border"
                  disabled={loading}
                  onClick={() => signInDemo(DEMO_ADMIN_EMAIL)}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Entrar como Administrador (teste)
                </Button>
              </div>
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar" onClick={() => setSubmittedPending(false)}>
                Solicitar cadastro
              </TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <Field label="E-mail">
                  <Input
                    type="email"
                    required
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
                <Button className="w-full" variant="outline" disabled={loading}>
                  Entrar com e-mail
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
                        placeholder="Ex.: UDESC Joinville, UFSC..."
                        value={faculdade}
                        onChange={(e) => setFaculdade(e.target.value)}
                      />
                    </Field>
                    <Field label="Nome do projeto / entidade">
                      <Input
                        required
                        placeholder="Ex.: GERM, Fórmula CEM..."
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

          <div className="mt-6 text-center">
            <Link
              to="/sobre"
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Conheça o Liga UNI
            </Link>
          </div>
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
