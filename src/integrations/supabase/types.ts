export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          enable_confidence_level: boolean
          enable_crowd_sun_feedback: boolean
          enable_seasonal_adjustment: boolean
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enable_confidence_level?: boolean
          enable_crowd_sun_feedback?: boolean
          enable_seasonal_adjustment?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enable_confidence_level?: boolean
          enable_crowd_sun_feedback?: boolean
          enable_seasonal_adjustment?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          patio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patio_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_patio_id_fkey"
            columns: ["patio_id"]
            isOneToOne: false
            referencedRelation: "patios"
            referencedColumns: ["id"]
          },
        ]
      }
      patio_submissions: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          submitted_by_user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_by_user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_by_user_id?: string | null
        }
        Relationships: []
      }
      patios: {
        Row: {
          address: string | null
          best_time_to_visit: string | null
          confidence_level:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          created_at: string | null
          hours: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          last_sun_check_at: string | null
          lat: number
          lng: number
          name: string
          neighborhood: string | null
          not_sunny_votes: number
          phone: string | null
          seasonal_adjustment_notes: string | null
          source: string | null
          sun_notes: string | null
          sun_profile: Database["public"]["Enums"]["sun_profile_type"] | null
          sun_score: number | null
          sun_score_base: number | null
          sun_score_reason: string | null
          sun_score_tuned: number | null
          sunny_votes: number
          tags: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          best_time_to_visit?: string | null
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          created_at?: string | null
          hours?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          last_sun_check_at?: string | null
          lat: number
          lng: number
          name: string
          neighborhood?: string | null
          not_sunny_votes?: number
          phone?: string | null
          seasonal_adjustment_notes?: string | null
          source?: string | null
          sun_notes?: string | null
          sun_profile?: Database["public"]["Enums"]["sun_profile_type"] | null
          sun_score?: number | null
          sun_score_base?: number | null
          sun_score_reason?: string | null
          sun_score_tuned?: number | null
          sunny_votes?: number
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          best_time_to_visit?: string | null
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          created_at?: string | null
          hours?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          last_sun_check_at?: string | null
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string | null
          not_sunny_votes?: number
          phone?: string | null
          seasonal_adjustment_notes?: string | null
          source?: string | null
          sun_notes?: string | null
          sun_profile?: Database["public"]["Enums"]["sun_profile_type"] | null
          sun_score?: number | null
          sun_score_base?: number | null
          sun_score_reason?: string | null
          sun_score_tuned?: number | null
          sunny_votes?: number
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      sun_checks: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          notes: string | null
          patio_id: string
          time_of_day: Database["public"]["Enums"]["time_of_day"]
          user_id: string | null
          visited_at: string
          was_sunny: boolean
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          notes?: string | null
          patio_id: string
          time_of_day: Database["public"]["Enums"]["time_of_day"]
          user_id?: string | null
          visited_at?: string
          was_sunny: boolean
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          notes?: string | null
          patio_id?: string
          time_of_day?: Database["public"]["Enums"]["time_of_day"]
          user_id?: string | null
          visited_at?: string
          was_sunny?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sun_checks_patio_id_fkey"
            columns: ["patio_id"]
            isOneToOne: false
            referencedRelation: "patios"
            referencedColumns: ["id"]
          },
        ]
      }
      sun_reports: {
        Row: {
          busy: Database["public"]["Enums"]["busy_status"] | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          notes: string | null
          patio_id: string
          photo_url: string | null
          reported_at: string | null
          status: Database["public"]["Enums"]["sun_status"]
          user_id: string | null
          wind: Database["public"]["Enums"]["wind_status"] | null
        }
        Insert: {
          busy?: Database["public"]["Enums"]["busy_status"] | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          patio_id: string
          photo_url?: string | null
          reported_at?: string | null
          status: Database["public"]["Enums"]["sun_status"]
          user_id?: string | null
          wind?: Database["public"]["Enums"]["wind_status"] | null
        }
        Update: {
          busy?: Database["public"]["Enums"]["busy_status"] | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          patio_id?: string
          photo_url?: string | null
          reported_at?: string | null
          status?: Database["public"]["Enums"]["sun_status"]
          user_id?: string | null
          wind?: Database["public"]["Enums"]["wind_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sun_reports_patio_id_fkey"
            columns: ["patio_id"]
            isOneToOne: false
            referencedRelation: "patios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_sun_score_base: { Args: never; Returns: number }
      can_submit_sun_check: {
        Args: {
          p_device_fingerprint?: string
          p_patio_id: string
          p_user_id?: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_sun_fields: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      busy_status: "quiet" | "medium" | "busy"
      confidence_level: "low" | "medium" | "high"
      submission_status: "pending" | "approved" | "rejected"
      sun_profile_type: "morning" | "midday" | "afternoon" | "mixed" | "unknown"
      sun_status: "sunny" | "part_shade" | "shaded"
      time_of_day: "morning" | "midday" | "afternoon"
      wind_status: "calm" | "breezy" | "windy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      busy_status: ["quiet", "medium", "busy"],
      confidence_level: ["low", "medium", "high"],
      submission_status: ["pending", "approved", "rejected"],
      sun_profile_type: ["morning", "midday", "afternoon", "mixed", "unknown"],
      sun_status: ["sunny", "part_shade", "shaded"],
      time_of_day: ["morning", "midday", "afternoon"],
      wind_status: ["calm", "breezy", "windy"],
    },
  },
} as const
