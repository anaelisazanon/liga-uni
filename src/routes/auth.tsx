import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownRight, CheckCircle2, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [demoModalOpen, setDemoModalOpen] = useState(false);

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
    setDemoModalOpen(false);
    toast.success(
      targetEmail === DEMO_ADMIN_EMAIL
        ? "Acesso de Administrador liberado!"
        : "Acesso de Líder liberado!",
    );
    await routeByUser(data.user.id);
  };

  return (
    <div className="relative grid min-h-screen md:grid-cols-2">
      {/* Ícone no canto com seta e texto indicando acesso rápido de demonstração */}
      {showDemo && (
        <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              title="Acesso rápido de demonstração"
              aria-label="Acesso rápido de demonstração"
              className="group fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 py-1.5 pl-3 pr-2 text-xs font-medium text-muted-foreground shadow-card backdrop-blur-xs transition hover:border-primary hover:bg-card hover:text-primary"
            >
              <span>Clique aqui para demonstrações</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-primary transition group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <KeyRound className="h-3.5 w-3.5" />
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Acesso Rápido (Demonstração)</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              Escolha um perfil abaixo para entrar diretamente no portal como <b>Líder de Equipe</b>{" "}
              ou como <b>Administrador do Ágora</b>:
            </p>
            <div className="mt-2 grid gap-2.5">
              <Button
                type="button"
                variant="default"
                className="h-auto w-full flex-col items-start gap-0.5 py-2.5 text-left"
                disabled={loading}
                onClick={() => signInDemo(DEMO_LEADER_EMAIL)}
              >
                <span className="flex items-center font-semibold">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Entrar como Líder — GERM (UDESC)
                </span>
                <span className="pl-6 text-[11px] font-normal opacity-85">
                  {DEMO_LEADER_EMAIL} · Painel da Entidade & LigaCoins
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-auto w-full flex-col items-start gap-0.5 border py-2.5 text-left"
                disabled={loading}
                onClick={() => signInDemo(DEMO_ADMIN_EMAIL)}
              >
                <span className="flex items-center font-semibold">
                  <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                  Entrar como Administrador do Ágora
                </span>
                <span className="pl-6 text-[11px] font-normal text-muted-foreground">
                  {DEMO_ADMIN_EMAIL} · Central de Aprovações & Gestão
                </span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
            Joinville, promovendo Reuniões Liga UNI, Capacitações, Auxílio de Staff em eventos,
            Oficinas entre equipes e uso integrado das salas com LigaCoins.
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
          <p className="mb-6 text-sm text-muted-foreground">
            Acesse com sua conta de <b>Líder de Entidade</b> ou <b>Administrador do Ágora</b>, ou
            solicite o cadastro de um novo projeto universitário.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar (Líder / Admin)</TabsTrigger>
              <TabsTrigger value="cadastrar" onClick={() => setSubmittedPending(false)}>
                Novo projeto (Líder)
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
                        placeholder="Nome da sua instituição de ensino"
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
