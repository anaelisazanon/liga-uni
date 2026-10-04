import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/apoio-eventos")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/capacitacoes" });
  },
});
