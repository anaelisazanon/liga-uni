import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Coins,
  DoorOpen,
  Gift,
  GraduationCap,
  HandHelping,
  Lightbulb,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_PORTAL_CONFIG,
  DEFAULT_REWARD_CATALOG,
  portalConfigQuery,
  rewardCatalogQuery,
  roomsQuery,
  savePortalConfig,
  saveRewardCatalog,
  type PortalConfig,
  type RewardItem,
  type Room,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Configurações, Salas & Benefícios — Admin Liga UNI" }] }),
  component: AdminConfiguracoesPage,
});

const emptyRoomForm = {
  nome: "",
  capacidade: "20",
  descricao: "",
  ativa: true,
};

const emptyRewardForm: Omit<RewardItem, "id"> = {
  titulo: "",
  descricao: "",
  custo: 150,
  categoria: "Ecossistema",
  ativo: true,
};

function AdminConfiguracoesPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const { data: rooms = [] } = useQuery(roomsQuery);
  const { data: rewardCatalog = DEFAULT_REWARD_CATALOG } = useQuery(rewardCatalogQuery);
  const { data: portalConfig = DEFAULT_PORTAL_CONFIG } = useQuery(portalConfigQuery);

  const initialTab =
    search.tab === "beneficios" || search.tab === "regras" ? search.tab : "salas";
  const [section, setSection] = useState<"salas" | "beneficios" | "regras">(initialTab);

  // Estado local de Configurações (Exigências Semestrais & LigaCoins)
  const [cfgForm, setCfgForm] = useState<PortalConfig>(portalConfig);

  useEffect(() => {
    setCfgForm(portalConfig);
  }, [portalConfig]);

  // Modal de Sala
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  // Modal de Benefício
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [rewardForm, setRewardForm] = useState<Omit<RewardItem, "id">>(emptyRewardForm);

  const openNewRoom = () => {
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
    setRoomDialogOpen(true);
  };

  const openEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomForm({
      nome: r.nome,
      capacidade: String(r.capacidade ?? 20),
      descricao: r.descricao ?? "",
      ativa: r.ativa,
    });
    setRoomDialogOpen(true);
  };

  const saveRoom = useMutation({
    mutationFn: async () => {
      if (!roomForm.nome.trim()) {
        throw new Error("Informe o nome da sala.");
      }
      const payload = {
        nome: roomForm.nome.trim(),
        capacidade: Math.max(1, Number(roomForm.capacidade) || 20),
        descricao: roomForm.descricao.trim(),
        ativa: roomForm.ativa,
      };
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        editingRoom ? "Sala atualizada com sucesso!" : "Nova sala adicionada ao Ágora Tech Park!",
      );
      setRoomDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRoomActive = useMutation({
    mutationFn: async (r: Room) => {
      const { error } = await supabase
        .from("rooms")
        .update({ ativa: !r.ativa })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Disponibilidade da sala atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Sala removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNewReward = () => {
    setEditingReward(null);
    setRewardForm(emptyRewardForm);
    setRewardDialogOpen(true);
  };

  const openEditReward = (item: RewardItem) => {
    setEditingReward(item);
    setRewardForm({
      titulo: item.titulo,
      descricao: item.descricao,
      custo: item.custo,
      categoria: item.categoria,
      ativo: item.ativo !== false,
    });
    setRewardDialogOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.titulo.trim()) {
      toast.error("Informe o título do benefício.");
      return;
    }
    const nextItem: RewardItem = {
      id: editingReward?.id ?? `reward-${Date.now()}`,
      titulo: rewardForm.titulo.trim(),
      descricao: rewardForm.descricao.trim(),
      custo: Math.max(1, Number(rewardForm.custo) || 100),
      categoria: rewardForm.categoria,
      ativo: rewardForm.ativo !== false,
    };

    const nextList = editingReward
      ? rewardCatalog.map((r) => (r.id === editingReward.id ? nextItem : r))
      : [...rewardCatalog, nextItem];

    saveRewardCatalog(nextList);
    qc.invalidateQueries({ queryKey: ["reward-catalog"] });
    toast.success(
      editingReward
        ? "Benefício atualizado na Loja de LigaCoins!"
        : "Novo benefício adicionado à Loja de LigaCoins!",
    );
    setRewardDialogOpen(false);
  };

  const handleDeleteReward = (id: string) => {
    const nextList = rewardCatalog.filter((r) => r.id !== id);
    saveRewardCatalog(nextList);
    qc.invalidateQueries({ queryKey: ["reward-catalog"] });
    toast.success("Benefício removido da loja.");
  };

  const handleResetRewards = () => {
    saveRewardCatalog(DEFAULT_REWARD_CATALOG);
    qc.invalidateQueries({ queryKey: ["reward-catalog"] });
    toast.success("Catálogo padrão de benefícios restaurado!");
  };

  const handleSavePortalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePortalConfig(cfgForm);
    qc.invalidateQueries({ queryKey: ["portal-config"] });
    qc.invalidateQueries({ queryKey: ["entities"] });
    toast.success(
      "Configurações de exigências semestrais e regras de LigaCoins salvas e aplicadas em todo o portal!",
    );
  };

  const handleResetPortalConfig = () => {
    setCfgForm(DEFAULT_PORTAL_CONFIG);
    savePortalConfig(DEFAULT_PORTAL_CONFIG);
    qc.invalidateQueries({ queryKey: ["portal-config"] });
    toast.success("Valores padrão restaurados!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salas, Benefícios & Configurações"
        description="Edite as salas disponíveis no Ágora Tech Park, gerencie os benefícios da Loja de LigaCoins e defina a quantidade de exigências semestrais e pontuações."
      />

      {/* Navegação de abas */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setSection("salas")}
          className={
            section === "salas"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <DoorOpen className="size-4" />
          Salas do Ágora ({rooms.length})
        </button>

        <button
          type="button"
          onClick={() => setSection("beneficios")}
          className={
            section === "beneficios"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <Gift className="size-4" />
          Benefícios da Loja ({rewardCatalog.length})
        </button>

        <button
          type="button"
          onClick={() => setSection("regras")}
          className={
            section === "regras"
              ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          <Settings2 className="size-4" />
          Exigências Semestrais & Pontos (LC)
        </button>
      </div>

      {/* ABA 1: SALAS EDITÁVEIS */}
      {section === "salas" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="space-y-0.5">
              <div className="font-display text-base font-bold">
                Espaços e Salas de Reunião do Ágora Tech Park
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione novas salas, edite nome, capacidade, recursos ou ative/desative salas para
                solicitações de equipes. Custo atual de reserva p/ reunião:{" "}
                <strong className="text-foreground">-{portalConfig.roomReservationCost} LC</strong>{" "}
                (oficinas abertas são gratuitas).
              </p>
            </div>
            <Button variant="hero" size="sm" onClick={openNewRoom}>
              <Plus className="mr-1 size-4" /> Nova Sala
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((r) => (
              <Card
                key={r.id}
                className={`flex flex-col justify-between gap-4 ${
                  !r.ativa ? "border-dashed opacity-70" : ""
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DoorOpen className="size-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-foreground">
                            {r.nome}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              r.ativa
                                ? "bg-success/15 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.ativa ? "Disponível" : "Inativa"}
                          </span>
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5 text-primary" /> Capacidade: {r.capacidade}{" "}
                          pessoas
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {r.descricao || "Sem descrição cadastrada."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={r.ativa}
                      onCheckedChange={() => toggleRoomActive.mutate(r)}
                    />
                    <span className="text-muted-foreground">
                      {r.ativa ? "Aceitando reservas" : "Bloqueada p/ reservas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEditRoom(r)}>
                      <Pencil className="mr-1 size-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteRoom.mutate(r.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: BENEFÍCIOS EDITÁVEIS */}
      {section === "beneficios" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="space-y-0.5">
              <div className="font-display text-base font-bold">
                Catálogo da Loja de Benefícios (LigaCoins)
              </div>
              <p className="text-xs text-muted-foreground">
                Edite títulos, descrições, categorias e custos em LigaCoins, ou cadastre novos
                benefícios para as entidades resgatarem.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetRewards}>
                <RotateCcw className="mr-1 size-3.5" /> Restaurar padrão
              </Button>
              <Button variant="hero" size="sm" onClick={openNewReward}>
                <Plus className="mr-1 size-4" /> Novo Benefício
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewardCatalog.map((item) => (
              <Card
                key={item.id}
                className={`flex flex-col justify-between gap-4 ${
                  item.ativo === false ? "border-dashed opacity-65" : ""
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {item.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      <Coins className="size-3.5" /> {item.custo} LC
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug text-foreground">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.descricao}</p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <span
                    className={`text-[11px] font-semibold ${
                      item.ativo === false ? "text-muted-foreground" : "text-success"
                    }`}
                  >
                    {item.ativo === false ? "Oculto na loja" : "Ativo na loja"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEditReward(item)}>
                      <Pencil className="mr-1 size-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteReward(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: EXIGÊNCIAS SEMESTRAIS E PONTUAÇÕES */}
      {section === "regras" && (
        <form onSubmit={handleSavePortalConfig} className="space-y-6">
          {/* Bloco 1: Exigências Semestrais */}
          <Card className="space-y-5 border-2 border-primary/25">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">
                    Quantidade de Exigências Semestrais de Permanência
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure quantas atividades cada entidade precisa cumprir no semestre para
                    permanecer em dia (reflete imediatamente nos painéis e alertas de todas as
                    equipes).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Semestre vigente:</Label>
                <Input
                  className="h-9 w-28 text-xs font-semibold"
                  value={cfgForm.semesterLabel}
                  onChange={(e) => setCfgForm({ ...cfgForm, semesterLabel: e.target.value })}
                  placeholder="2026/2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Meta 1: Reuniões */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Megaphone className="size-4" /> 1. Reuniões Liga UNI
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Exigir 100% das reuniões ativas</span>
                  <Switch
                    checked={cfgForm.goalMeetingsAll}
                    onCheckedChange={(v) => setCfgForm({ ...cfgForm, goalMeetingsAll: v })}
                  />
                </div>
                {!cfgForm.goalMeetingsAll && (
                  <div className="space-y-1">
                    <Label className="text-xs">Mínimo de reuniões no semestre</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={cfgForm.goalMeetingsCustom}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          goalMeetingsCustom: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {cfgForm.goalMeetingsAll
                    ? "As equipes devem ter presença em todas as reuniões gerais convocadas."
                    : `Meta fixa de ${cfgForm.goalMeetingsCustom} reunião(ões) no semestre.`}
                </p>
              </div>

              {/* Meta 2: Staff */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <HandHelping className="size-4" /> 2. Staff em Eventos
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade mínima no semestre</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={cfgForm.goalStaff}
                    onChange={(e) =>
                      setCfgForm({
                        ...cfgForm,
                        goalStaff: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Padrão: 2 eventos apoiados como Staff no semestre.
                </p>
              </div>

              {/* Meta 3: Capacitações */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <GraduationCap className="size-4" /> 3. Capacitações UNI
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade mínima no semestre</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={cfgForm.goalTrainings}
                    onChange={(e) =>
                      setCfgForm({
                        ...cfgForm,
                        goalTrainings: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Padrão: 2 capacitações com membros inscritos no semestre.
                </p>
              </div>

              {/* Meta 4: Oficinas */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Lightbulb className="size-4" /> 4. Oficinas Oferecidas
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade mínima no semestre</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={cfgForm.goalWorkshops}
                    onChange={(e) =>
                      setCfgForm({
                        ...cfgForm,
                        goalWorkshops: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Padrão: 1 oficina ministrada pela equipe para outras entidades.
                </p>
              </div>
            </div>
          </Card>

          {/* Bloco 2: Configuração de Moedas (LigaCoins) e Custo de Sala */}
          <Card className="space-y-5">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <Coins className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">
                  Pontuação de Atividades & Custo de Reserva de Sala (LigaCoins)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Personalize quantas LigaCoins cada atividade concede por membro e por evento, bem
                  como o custo de reserva de sala para reuniões internas.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border p-4 space-y-2.5">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <DoorOpen className="size-4" /> Reserva de Sala (Reunião de Equipe)
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Custo por reserva aprovada (LC)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cfgForm.roomReservationCost}
                    onChange={(e) =>
                      setCfgForm({
                        ...cfgForm,
                        roomReservationCost: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Oficinas abertas para outras equipes continuam 100% gratuitas.
                </p>
              </div>

              <div className="rounded-xl border p-4 space-y-2.5">
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <Megaphone className="size-4" /> Reuniões Liga UNI (Ganhos)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">LC / representante</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.meetingMemberCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          meetingMemberCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bônus fixo evento</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.meetingEventCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          meetingEventCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2.5">
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <HandHelping className="size-4" /> Staff em Eventos (Ganhos)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">LC / voluntário</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.staffMemberCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          staffMemberCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bônus fixo evento</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.staffEventCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          staffEventCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2.5">
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <GraduationCap className="size-4" /> Capacitações UNI (Ganhos)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">LC / membro</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.trainingMemberCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          trainingMemberCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bônus fixo evento</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.trainingEventCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          trainingEventCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2.5 sm:col-span-2">
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <Lightbulb className="size-4" /> Oferecer Oficina p/ Equipes (Ganhos)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">LC / ministrante</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.workshopMemberCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          workshopMemberCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bônus por oficina</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.workshopEventCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          workshopEventCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bônus em conjunto</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cfgForm.workshopJointBonusCoins}
                      onChange={(e) =>
                        setCfgForm({
                          ...cfgForm,
                          workshopJointBonusCoins: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleResetPortalConfig}>
                <RefreshCw className="mr-1.5 size-4" /> Restaurar padrões do sistema
              </Button>
              <Button type="submit" variant="hero">
                <Save className="mr-1.5 size-4" /> Salvar todas as configurações
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Modal Criar / Editar Sala */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Editar Sala do Ágora" : "Nova Sala no Ágora Tech Park"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRoom.mutate();
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Nome da sala / espaço</Label>
              <Input
                required
                value={roomForm.nome}
                onChange={(e) => setRoomForm({ ...roomForm, nome: e.target.value })}
                placeholder="Ex.: Sala de Reunião C — Ágora.Share"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Capacidade máxima (pessoas)</Label>
              <Input
                type="number"
                min={1}
                required
                value={roomForm.capacidade}
                onChange={(e) => setRoomForm({ ...roomForm, capacidade: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição / Equipamentos disponíveis</Label>
              <Textarea
                rows={3}
                value={roomForm.descricao}
                onChange={(e) => setRoomForm({ ...roomForm, descricao: e.target.value })}
                placeholder="Ex.: Equipada com TV 65', cabo HDMI, quadro branco e ar-condicionado."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Sala ativa para reservas</div>
              <Switch
                checked={roomForm.ativa}
                onCheckedChange={(v) => setRoomForm({ ...roomForm, ativa: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRoomDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveRoom.isPending}>
                <CheckCircle2 className="mr-1.5 size-4" />
                {saveRoom.isPending ? "Salvando..." : "Salvar sala"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Criar / Editar Benefício */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingReward ? "Editar Benefício LigaCoins" : "Novo Benefício na Loja"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReward} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título do benefício / recompensa</Label>
              <Input
                required
                value={rewardForm.titulo}
                onChange={(e) => setRewardForm({ ...rewardForm, titulo: e.target.value })}
                placeholder="Ex.: Mentoria VIP com Empresa Residente"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <select
                  value={rewardForm.categoria}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      categoria: e.target.value as RewardItem["categoria"],
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Ecossistema">Ecossistema</option>
                  <option value="Divulgação">Divulgação</option>
                  <option value="Estrutura">Estrutura</option>
                  <option value="Reconhecimento">Reconhecimento</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Custo (LigaCoins)</Label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={rewardForm.custo}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, custo: Math.max(1, Number(e.target.value) || 0) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição detalhada</Label>
              <Textarea
                rows={3}
                required
                value={rewardForm.descricao}
                onChange={(e) => setRewardForm({ ...rewardForm, descricao: e.target.value })}
                placeholder="Explique como funciona a entrega deste benefício para a equipe..."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Disponível na loja para os líderes</div>
              <Switch
                checked={rewardForm.ativo !== false}
                onCheckedChange={(v) => setRewardForm({ ...rewardForm, ativo: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRewardDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <CheckCircle2 className="mr-1.5 size-4" /> Salvar benefício
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
