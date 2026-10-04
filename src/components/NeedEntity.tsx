import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NeedEntity() {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <h2 className="text-xl font-semibold">Cadastre sua entidade primeiro</h2>
      <p className="mt-1 text-muted-foreground">
        Você precisa registrar sua equipe antes de continuar.
      </p>
      <Button asChild className="mt-6">
        <Link to="/lider/equipe">Cadastrar equipe</Link>
      </Button>
    </div>
  );
}
