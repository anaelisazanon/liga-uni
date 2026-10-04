import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lider/reservas")({
  beforeLoad: () => {
    throw redirect({ to: "/lider/capacitacoes", search: { tab: "reunioes-equipe" } });
  },
});
