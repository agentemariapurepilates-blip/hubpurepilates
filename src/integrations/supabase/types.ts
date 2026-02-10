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
      artes_prontas: {
        Row: {
          canva_url: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          canva_url: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          canva_url?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      avisos: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string
          id: string
          image_url: string | null
          is_active: boolean | null
          partner_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          partner_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          partner_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          emoji: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emoji?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emoji?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_assignees: {
        Row: {
          created_at: string
          demand_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demand_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demand_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_assignees_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_attachments: {
        Row: {
          comment_id: string | null
          created_at: string
          demand_id: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          demand_id?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          demand_id?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "demand_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_attachments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_comments: {
        Row: {
          content: string
          created_at: string
          demand_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          demand_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          demand_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_comments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_notifications: {
        Row: {
          created_at: string
          created_by: string
          demand_id: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          demand_id: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          demand_id?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_notifications_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          from_department: string
          id: string
          priority: Database["public"]["Enums"]["demand_priority"]
          status: Database["public"]["Enums"]["demand_status"]
          title: string
          to_department: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          from_department: string
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          title: string
          to_department: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          from_department?: string
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          title?: string
          to_department?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          start_date: string
          tag: Database["public"]["Enums"]["event_tag"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          tag?: Database["public"]["Enums"]["event_tag"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          tag?: Database["public"]["Enums"]["event_tag"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materiais_implantacao: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          link_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          link_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_content: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          document_url: string | null
          id: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          step_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          id?: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          step_order: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          id?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          step_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          image_url: string | null
          pinned: boolean | null
          post_type: string | null
          sector: Database["public"]["Enums"]["sector_type"]
          short_description: string | null
          target_month: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean | null
          post_type?: string | null
          sector: Database["public"]["Enums"]["sector_type"]
          short_description?: string | null
          target_month?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean | null
          post_type?: string | null
          sector?: Database["public"]["Enums"]["sector_type"]
          short_description?: string | null
          target_month?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean | null
          requested_user_type: Database["public"]["Enums"]["user_type"] | null
          sector: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          requested_user_type?: Database["public"]["Enums"]["user_type"] | null
          sector?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          requested_user_type?: Database["public"]["Enums"]["user_type"] | null
          sector?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      social_media_comments: {
        Row: {
          comment: string
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment: string
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment?: string
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "social_media_content"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_content: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          end_date: string
          google_drive_url: string | null
          id: string
          posting_date: string | null
          start_date: string
          tag: Database["public"]["Enums"]["social_media_tag"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          google_drive_url?: string | null
          id?: string
          posting_date?: string | null
          start_date: string
          tag?: Database["public"]["Enums"]["social_media_tag"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          google_drive_url?: string | null
          id?: string
          posting_date?: string | null
          start_date?: string
          tag?: Database["public"]["Enums"]["social_media_tag"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_colaborador: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      demand_priority: "low" | "medium" | "high"
      demand_status: "pending" | "in_progress" | "completed" | "cancelled"
      event_tag: "pacotes" | "pure_pass" | "pure_club"
      profile_type: "colaborador" | "professor" | "franqueado"
      sector_type:
        | "estudios"
        | "franchising"
        | "academy"
        | "marketing"
        | "tecnologia"
        | "expansao"
        | "consultoras"
        | "implantacao"
        | "pure_store"
      social_media_tag: "reels" | "desafio_semana" | "carrossel" | "estatico"
      user_type: "colaborador" | "franqueado"
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
      demand_priority: ["low", "medium", "high"],
      demand_status: ["pending", "in_progress", "completed", "cancelled"],
      event_tag: ["pacotes", "pure_pass", "pure_club"],
      profile_type: ["colaborador", "professor", "franqueado"],
      sector_type: [
        "estudios",
        "franchising",
        "academy",
        "marketing",
        "tecnologia",
        "expansao",
        "consultoras",
        "implantacao",
        "pure_store",
      ],
      social_media_tag: ["reels", "desafio_semana", "carrossel", "estatico"],
      user_type: ["colaborador", "franqueado"],
    },
  },
} as const
