import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, DoorOpen, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Conheça o Liga UNI — Ágora Tech Park" },
      {
        name: "description",
        content:
          "O Liga UNI conecta o programa Liga Ágora aos projetos universitários no Ágora Tech Park em Joinville.",
      },
      { property: "og:title", content: "Conheça o Liga UNI — Ágora Tech Park" },
      {
        property: "og:description",
        content:
          "O Liga UNI conecta o programa Liga Ágora aos projetos universitários no Ágora Tech Park em Joinville.",
      },
    ],
  }),
  component: SobrePage,
});

const features = [
  {
    icon: Users,
    title: "Equipes e projetos universitários",
    text: "Cadastre sua entidade acadêmica e os membros com seus respectivos cursos.",
  },
  {
    icon: CalendarDays,
    title: "Capacitações, eventos e hackathons",
    text: "Acompanhe o calendário de atividades, imersões e eventos das entidades no Ágora.",
  },
  {
    icon: DoorOpen,
    title: "Salas do Ágora Tech Park",
    text: "Solicite reservas de espaços e salas de reunião e acompanhe a aprovação em tempo real.",
  },
];

function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-display text-xl font-bold">
            Liga <span className="text-accent">UNI</span>
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-28 pt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">
            Liga UNI · Ágora Tech Park
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Projetos universitários conectados ao ecossistema de inovação do Ágora.
          </h1>
          <p className="mt-6 max-w-2xl text-base opacity-90 md:text-lg">
            O Liga UNI é a união entre o Liga Ágora — programa voluntário de capacitação de talentos
            universitários — e os projetos universitários dentro do Ágora Tech Park (Joinville). O
            Ágora oferece capacitações, eventos, convívio com outros grupos e hackathons, enquanto
            os projetos colaboram com as iniciativas do parque.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth">
              Acessar plataforma <ArrowRight />
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
