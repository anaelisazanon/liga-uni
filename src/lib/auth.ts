import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "leader";

export async function getMyRole(userId: string): Promise<Role> {
  const { data: reqData } = await supabase
    .from("leader_requests")
    .select("status, admin_note")
    .eq("user_id", userId)
    .maybeSingle();

  if (reqData && reqData.status === "pending") {
    await supabase.auth.signOut();
    throw new Error(
      "Seu cadastro está aguardando aprovação do administrador. Você poderá entrar assim que for aprovado.",
    );
  }
  if (reqData && reqData.status === "rejected") {
    await supabase.auth.signOut();
    const motivo = reqData.admin_note ? ` Motivo: ${reqData.admin_note}` : "";
    throw new Error(`Seu cadastro não foi aprovado pelo administrador.${motivo}`);
  }

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.error("[Auth] Erro ao consultar papel do usuário:", error);
    throw new Error(`Não foi possível verificar o seu papel de acesso: ${error.message}`);
  }
  return data?.some((r) => r.role === "admin") ? "admin" : "leader";
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: string }).message);
  return "Erro inesperado";
}

export function authErrMsg(e: unknown): string {
  const raw = errMsg(e);
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar";
  }
  console.error("[Auth]", e);
  return raw;
}

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
