import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      throw redirect({ to: "/auth", replace: true });
    }
    const role = await getMyRole(user.id);
    throw redirect({ to: role === "admin" ? "/admin" : "/lider", replace: true });
  },
  component: () => null,
});
