export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      entities: {
        Row: {
          created_at: string;
          descricao: string;
          id: string;
          leader_id: string;
          nome: string;
        };
        Insert: {
          created_at?: string;
          descricao?: string;
          id?: string;
          leader_id: string;
          nome: string;
        };
        Update: {
          created_at?: string;
          descricao?: string;
          id?: string;
          leader_id?: string;
          nome?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entities_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          descricao: string;
          entity_id: string;
          fim: string;
          id: string;
          inicio: string;
          local: string;
          titulo: string;
        };
        Insert: {
          created_at?: string;
          descricao?: string;
          entity_id: string;
          fim: string;
          id?: string;
          inicio: string;
          local?: string;
          titulo: string;
        };
        Update: {
          created_at?: string;
          descricao?: string;
          entity_id?: string;
          fim?: string;
          id?: string;
          inicio?: string;
          local?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      leader_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          descricao: string
          email: string
          faculdade: string
          id: string
          nome_lider: string
          projeto: string
          status: Database["public"]["Enums"]["reservation_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          descricao?: string
          email: string
          faculdade: string
          id?: string
          nome_lider: string
          projeto: string
          status?: Database["public"]["Enums"]["reservation_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          descricao?: string
          email?: string
          faculdade?: string
          id?: string
          nome_lider?: string
          projeto?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          user_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string;
          curso: string;
          email: string;
          entity_id: string;
          id: string;
          nome: string;
        };
        Insert: {
          created_at?: string;
          curso?: string;
          email?: string;
          entity_id: string;
          id?: string;
          nome: string;
        };
        Update: {
          created_at?: string;
          curso?: string;
          email?: string;
          entity_id?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          nome: string;
        };
        Insert: {
          created_at?: string;
          email?: string;
          id: string;
          nome?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          admin_note: string | null;
          created_at: string;
          entity_id: string;
          event_id: string | null;
          fim: string;
          id: string;
          inicio: string;
          motivo: string;
          requested_by: string;
          room_id: string;
          status: Database["public"]["Enums"]["reservation_status"];
        };
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          entity_id: string;
          event_id?: string | null;
          fim: string;
          id?: string;
          inicio: string;
          motivo?: string;
          requested_by: string;
          room_id: string;
          status?: Database["public"]["Enums"]["reservation_status"];
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          entity_id?: string;
          event_id?: string | null;
          fim?: string;
          id?: string;
          inicio?: string;
          motivo?: string;
          requested_by?: string;
          room_id?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
        };
        Relationships: [
          {
            foreignKeyName: "reservations_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          ativa: boolean;
          capacidade: number;
          created_at: string;
          descricao: string;
          id: string;
          nome: string;
        };
        Insert: {
          ativa?: boolean;
          capacidade?: number;
          created_at?: string;
          descricao?: string;
          id?: string;
          nome: string;
        };
        Update: {
          ativa?: boolean;
          capacidade?: number;
          created_at?: string;
          descricao?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      owns_entity: { Args: { _entity: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "leader";
      reservation_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "leader"],
      reservation_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
