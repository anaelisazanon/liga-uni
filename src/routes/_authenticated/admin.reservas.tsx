import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/reservas")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/aprovacoes", search: { tab: "reunioes-equipe" } });
  },
});
