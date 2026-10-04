import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/salas")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/reservas" });
  },
});
