import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Entity = Database["public"]["Tables"]["entities"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LeaderRequest = Database["public"]["Tables"]["leader_requests"]["Row"];
export type BusySlot = { inicio: string; fim: string };

const unwrap = <T>(r: { data: T | null; error: unknown }) => {
  if (r.error) throw r.error;
  return r.data as T;
};

export const myProfileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-profile", userId],
    queryFn: async () =>
      unwrap(
        await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      ) as Profile | null,
  });

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: async () =>
    unwrap(await supabase.from("profiles").select("*").order("nome")) as Profile[],
});

export const leaderRequestsQuery = queryOptions({
  queryKey: ["leader-requests"],
  queryFn: async () =>
    unwrap(
      await supabase.from("leader_requests").select("*").order("created_at", { ascending: false }),
    ) as LeaderRequest[],
});

export const myEntityQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-entity", userId],
    queryFn: async () =>
      unwrap(
        await supabase.from("entities").select("*").eq("leader_id", userId).maybeSingle(),
      ) as Entity | null,
  });

export const entitiesQuery = queryOptions({
  queryKey: ["entities"],
  queryFn: async () =>
    unwrap(await supabase.from("entities").select("*").order("nome")) as Entity[],
});

export const membersQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["members", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("members").select("*").order("nome");
      if (entityId) q = q.eq("entity_id", entityId);
      return unwrap(await q) as Member[];
    },
  });

export const eventsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["events", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("inicio");
      if (entityId) q = q.eq("entity_id", entityId);
      return unwrap(await q) as Event[];
    },
  });

export const roomsQuery = queryOptions({
  queryKey: ["rooms"],
  queryFn: async () => unwrap(await supabase.from("rooms").select("*").order("nome")) as Room[],
});

export const reservationsQuery = (entityId?: string) =>
  queryOptions({
    queryKey: ["reservations", entityId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("reservations").select("*").order("inicio", { ascending: false });
      if (entityId) q = q.eq("entity_id", entityId);
      return unwrap(await q) as Reservation[];
    },
  });

export const roomBusyQuery = (roomId: string, fromIso: string, toIso: string) =>
  queryOptions({
    queryKey: ["room-busy", roomId, fromIso, toIso],
    queryFn: async () => {
      if (!roomId) return [] as BusySlot[];
      const client = supabase as unknown as {
        rpc: (
          fn: string,
          args: { _room: string; _from: string; _to: string },
        ) => Promise<{ data: BusySlot[] | null; error: unknown }>;
      };
      const res = await client.rpc("room_busy", { _room: roomId, _from: fromIso, _to: toIso });
      if (res.error) {
        console.warn("[room_busy]", res.error);
        return [] as BusySlot[];
      }
      return (res.data ?? []) as BusySlot[];
    },
  });
