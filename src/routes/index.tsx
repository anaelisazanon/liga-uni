import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, DoorOpen, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Liga UNI — Gestão de entidades acadêmicas" },
      { name: "description", content: "Organize equipes, eventos e reservas das salas do Ágora em um só lugar." },
      { property: "og:title", content: "Liga UNI — Gestão de entidades acadêmicas" },
      { property: "og:description", content: "Organize equipes, eventos e reservas das salas do Ágora em um só lugar." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Users, title: "Equipes e membros", text: "Cadastre sua entidade e os membros com seus cursos." },
  { icon: CalendarDays, title: "Calendário unificado", text: "Eventos de todas as entidades em um só calendário." },
  { icon: DoorOpen, title: "Salas do Ágora", text: "Solicite reservas e acompanhe a aprovação em tempo real." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <span className="font-display text-xl font-bold">
            Liga <span className="text-accent">UNI</span>
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-28 pt-20">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Plataforma acadêmica</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
            Entidades, eventos e o Ágora — organizados.
          </h1>
          <p className="mt-6 max-w-xl text-lg opacity-80">
            A Liga UNI conecta líderes de entidades e a gestão do campus num fluxo simples.
          </p>
          <Button asChild size="lg" className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth">
              Começar agora <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto -mt-14 grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
