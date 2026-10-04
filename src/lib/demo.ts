// TODO remover antes de uso real
export const DEMO_LEADER_EMAIL = "lider.teste@example.com";
export const DEMO_PENDING_LEADER_EMAIL = "babitonga@joinville.ufsc.br";
export const DEMO_ADMIN_EMAIL = "admin.teste@example.com";
export const DEMO_PASSWORD = "Teste@12345";

export function isDemoLoginEnabled(): boolean {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : ({} as Record<string, string | undefined>);
  // Habilitado por padrão para testes e homologação, a menos que explicitamente desativado com VITE_DEMO_LOGIN=false
  return env["VITE_DEMO_LOGIN"] !== "false";
}
