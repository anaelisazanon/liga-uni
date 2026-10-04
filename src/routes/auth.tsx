import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, errMsg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Liga UNI" },
      { name: "description", content: "Acesse a Liga UNI como líder de entidade ou administrador." },
      { property: "og:title", content: "Entrar — Liga UNI" },
      { property: "og:description", content: "Acesse a Liga UNI como líder de entidade ou administrador." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) { toast.error("E-mail ou senha inválidos"); return; }
    const role = await getMyRole(data.user.id);
    navigate({ to: role === "admin" ? "/admin" : "/lider", replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin + "/auth", data: { nome } },
    });
    setLoading(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="font-display text-xl font-bold">
          Liga <span className="text-accent">UNI</span>
        </Link>
        <h2 className="text-4xl font-bold leading-tight">Sua entidade, organizada do jeito certo.</h2>
        <p className="text-sm opacity-70">Gestão acadêmica · Ágora</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">Bem-vindo</h1>
          <p className="mb-6 text-sm text-muted-foreground">Entre ou crie sua conta de líder.</p>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Senha"><Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></Field>
                <Button className="w-full" disabled={loading}>Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="cadastrar">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <Field label="Nome"><Input required value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
                <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Senha"><Input type="password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} /></Field>
                <Button className="w-full" disabled={loading}>Criar conta</Button>
              </form>
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
