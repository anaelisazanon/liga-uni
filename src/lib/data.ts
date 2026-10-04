import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Entity = Database["public"]["Tables"]["entities"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

const unwrap = <T,>(r: { data: T | null; error: unknown }) => {
  if (r.error) throw r.error;
  return r.data as T;
};

export const myEntityQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-entity", userId],
    queryFn: async () =>
      unwrap(await supabase.from("entities").select("*").eq("leader_id", userId).maybeSingle()) as Entity | null,
  });

export const entitiesQuery = queryOptions({
  queryKey: ["entities"],
  queryFn: async () => unwrap(await supabase.from("entities").select("*").order("nome")) as Entity[],
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
