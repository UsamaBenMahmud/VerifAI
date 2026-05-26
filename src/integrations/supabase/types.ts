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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          admin_notes: string | null
          analysis_time_ms: number | null
          category: string | null
          claude_latency_ms: number | null
          confidence: number | null
          content_type: string | null
          created_at: string
          expires_at: string
          explanation_bn: string | null
          explanation_en: string | null
          fake_probability: number | null
          file_size_bytes: number | null
          hf_latency_ms: number | null
          human_verdict: string | null
          id: string
          image_url: string
          is_visible: boolean | null
          model_version: string | null
          original_filename: string | null
          real_probability: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_credibility_score: number | null
          source_domain: string | null
          trust_score: number | null
          user_id: string | null
          verdict: string | null
          verdict_bn: string | null
        }
        Insert: {
          admin_notes?: string | null
          analysis_time_ms?: number | null
          category?: string | null
          claude_latency_ms?: number | null
          confidence?: number | null
          content_type?: string | null
          created_at?: string
          expires_at?: string
          explanation_bn?: string | null
          explanation_en?: string | null
          fake_probability?: number | null
          file_size_bytes?: number | null
          hf_latency_ms?: number | null
          human_verdict?: string | null
          id?: string
          image_url: string
          is_visible?: boolean | null
          model_version?: string | null
          original_filename?: string | null
          real_probability?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_credibility_score?: number | null
          source_domain?: string | null
          trust_score?: number | null
          user_id?: string | null
          verdict?: string | null
          verdict_bn?: string | null
        }
        Update: {
          admin_notes?: string | null
          analysis_time_ms?: number | null
          category?: string | null
          claude_latency_ms?: number | null
          confidence?: number | null
          content_type?: string | null
          created_at?: string
          expires_at?: string
          explanation_bn?: string | null
          explanation_en?: string | null
          fake_probability?: number | null
          file_size_bytes?: number | null
          hf_latency_ms?: number | null
          human_verdict?: string | null
          id?: string
          image_url?: string
          is_visible?: boolean | null
          model_version?: string | null
          original_filename?: string | null
          real_probability?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_credibility_score?: number | null
          source_domain?: string | null
          trust_score?: number | null
          user_id?: string | null
          verdict?: string | null
          verdict_bn?: string | null
        }
        Relationships: []
      }
      presentations: {
        Row: {
          created_at: string | null
          description: string | null
          file_size_bytes: number | null
          id: string
          is_active: boolean | null
          original_filename: string | null
          slide_count: number | null
          slide_image_urls: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          original_filename?: string | null
          slide_count?: number | null
          slide_image_urls?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          original_filename?: string | null
          slide_count?: number | null
          slide_image_urls?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          analyses_count: number | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          organization: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          analyses_count?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          organization?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          analyses_count?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          organization?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      submission_links: {
        Row: {
          key: string
          updated_at: string
          url: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_analyses: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string | null
          trust_score: number | null
          verdict: string | null
          verdict_bn: string | null
        }
        Relationships: []
      }
      public_feed: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string | null
          human_verdict: string | null
          id: string | null
          source_credibility_score: number | null
          source_domain: string | null
          trust_score: number | null
          verdict: string | null
          verdict_bn: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
