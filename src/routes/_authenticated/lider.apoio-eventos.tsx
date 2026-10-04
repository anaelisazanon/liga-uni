import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lider/apoio-eventos")({
  beforeLoad: () => {
    throw redirect({ to: "/lider/capacitacoes", search: { tab: "staff" } });
  },
});
