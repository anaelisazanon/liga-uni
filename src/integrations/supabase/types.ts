export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admin_messages: {
        Row: {
          assunto: string;
          created_at: string;
          entity_id: string;
          id: string;
          mensagem: string;
          resposta: string | null;
          status: "pending" | "answered";
          topico: string;
        };
        Insert: {
          assunto: string;
          created_at?: string;
          entity_id: string;
          id?: string;
          mensagem: string;
          resposta?: string | null;
          status?: "pending" | "answered";
          topico?: string;
        };
        Update: {
          assunto?: string;
          created_at?: string;
          entity_id?: string;
          id?: string;
          mensagem?: string;
          resposta?: string | null;
          status?: "pending" | "answered";
          topico?: string;
        };
        Relationships: [];
      };
      entities: {
        Row: {
          avisos_email?: boolean;
          created_at: string;
          descricao: string;
          id: string;
          leader_id: string;
          nome: string;
        };
        Insert: {
          avisos_email?: boolean;
          created_at?: string;
          descricao?: string;
          id?: string;
          leader_id: string;
          nome: string;
        };
        Update: {
          avisos_email?: boolean;
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
      general_meetings: {
        Row: {
          ativa: boolean;
          created_at: string;
          fim: string;
          id: string;
          inicio: string;
          local: string;
          obrigatoria: boolean;
          pauta: string;
          pontos: number;
          titulo: string;
        };
        Insert: {
          ativa?: boolean;
          created_at?: string;
          fim: string;
          id?: string;
          inicio: string;
          local?: string;
          obrigatoria?: boolean;
          pauta?: string;
          pontos?: number;
          titulo: string;
        };
        Update: {
          ativa?: boolean;
          created_at?: string;
          fim?: string;
          id?: string;
          inicio?: string;
          local?: string;
          obrigatoria?: boolean;
          pauta?: string;
          pontos?: number;
          titulo?: string;
        };
        Relationships: [];
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
      meeting_attendances: {
        Row: {
          created_at: string;
          entity_id: string;
          id: string;
          meeting_id: string;
          moedas_liberadas: boolean;
          presente: boolean;
          representantes: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          id?: string;
          meeting_id: string;
          moedas_liberadas?: boolean;
          presente?: boolean;
          representantes: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          id?: string;
          meeting_id?: string;
          moedas_liberadas?: boolean;
          presente?: boolean;
          representantes?: string;
        };
        Relationships: [];
      };
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
      peer_workshops: {
        Row: {
          created_at: string;
          data_sugerida: string;
          descricao: string;
          em_conjunto?: boolean;
          entity_id: string;
          fim?: string;
          id: string;
          ministrantes: string;
          moedas_liberadas: boolean;
          partner_entity_id?: string | null;
          room_id?: string | null;
          status: Database["public"]["Enums"]["reservation_status"];
          titulo: string;
        };
        Insert: {
          created_at?: string;
          data_sugerida?: string;
          descricao?: string;
          em_conjunto?: boolean;
          entity_id: string;
          fim?: string;
          id?: string;
          ministrantes?: string;
          moedas_liberadas?: boolean;
          partner_entity_id?: string | null;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          titulo: string;
        };
        Update: {
          created_at?: string;
          data_sugerida?: string;
          descricao?: string;
          em_conjunto?: boolean;
          entity_id?: string;
          fim?: string;
          id?: string;
          ministrantes?: string;
          moedas_liberadas?: boolean;
          partner_entity_id?: string | null;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          titulo?: string;
        };
        Relationships: [];
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
          purpose: "reuniao_projeto" | "capacitacao_geral";
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
          purpose?: "reuniao_projeto" | "capacitacao_geral";
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
          purpose?: "reuniao_projeto" | "capacitacao_geral";
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
      reward_redemptions: {
        Row: {
          created_at: string;
          custo: number;
          entity_id: string;
          id: string;
          observacao: string;
          recompensa_id: string;
          recompensa_titulo: string;
          status: Database["public"]["Enums"]["reservation_status"];
        };
        Insert: {
          created_at?: string;
          custo: number;
          entity_id: string;
          id?: string;
          observacao?: string;
          recompensa_id: string;
          recompensa_titulo: string;
          status?: Database["public"]["Enums"]["reservation_status"];
        };
        Update: {
          created_at?: string;
          custo?: number;
          entity_id?: string;
          id?: string;
          observacao?: string;
          recompensa_id?: string;
          recompensa_titulo?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
        };
        Relationships: [];
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
      staff_calls: {
        Row: {
          ativa: boolean;
          created_at: string;
          descricao: string;
          evento: string;
          fim: string;
          id: string;
          inicio: string;
          local: string;
          vagas: number;
        };
        Insert: {
          ativa?: boolean;
          created_at?: string;
          descricao?: string;
          evento: string;
          fim: string;
          id?: string;
          inicio: string;
          local?: string;
          vagas?: number;
        };
        Update: {
          ativa?: boolean;
          created_at?: string;
          descricao?: string;
          evento?: string;
          fim?: string;
          id?: string;
          inicio?: string;
          local?: string;
          vagas?: number;
        };
        Relationships: [];
      };
      staff_volunteers: {
        Row: {
          call_id: string;
          created_at: string;
          entity_id: string;
          id: string;
          moedas_liberadas: boolean;
          observacao: string;
          participantes: string;
        };
        Insert: {
          call_id: string;
          created_at?: string;
          entity_id: string;
          id?: string;
          moedas_liberadas?: boolean;
          observacao?: string;
          participantes: string;
        };
        Update: {
          call_id?: string;
          created_at?: string;
          entity_id?: string;
          id?: string;
          moedas_liberadas?: boolean;
          observacao?: string;
          participantes?: string;
        };
        Relationships: [];
      };
      training_registrations: {
        Row: {
          created_at: string;
          entity_id: string;
          id: string;
          moedas_liberadas: boolean;
          participantes: string;
          training_id: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          id?: string;
          moedas_liberadas?: boolean;
          participantes: string;
          training_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          id?: string;
          moedas_liberadas?: boolean;
          participantes?: string;
          training_id?: string;
        };
        Relationships: [];
      };
      trainings: {
        Row: {
          ativa: boolean;
          created_at: string;
          descricao: string;
          fim: string;
          id: string;
          inicio: string;
          local: string;
          ministrante: string;
          titulo: string;
          vagas: number;
        };
        Insert: {
          ativa?: boolean;
          created_at?: string;
          descricao?: string;
          fim: string;
          id?: string;
          inicio: string;
          local?: string;
          ministrante?: string;
          titulo: string;
          vagas?: number;
        };
        Update: {
          ativa?: boolean;
          created_at?: string;
          descricao?: string;
          fim?: string;
          id?: string;
          inicio?: string;
          local?: string;
          ministrante?: string;
          titulo?: string;
          vagas?: number;
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
