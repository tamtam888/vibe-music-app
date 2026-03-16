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
      favorite_tracks: {
        Row: {
          artist: string
          created_at: string | null
          duration: string
          id: string
          title: string
          track_id: string
          url: string
          user_id: string
        }
        Insert: {
          artist?: string
          created_at?: string | null
          duration?: string
          id?: string
          title: string
          track_id: string
          url: string
          user_id: string
        }
        Update: {
          artist?: string
          created_at?: string | null
          duration?: string
          id?: string
          title?: string
          track_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_favorite_tracks_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      recently_played: {
        Row: {
          artist: string
          duration: string
          id: string
          played_at: string | null
          title: string
          track_id: string
          url: string
          user_id: string
        }
        Insert: {
          artist?: string
          duration?: string
          id?: string
          played_at?: string | null
          title: string
          track_id: string
          url: string
          user_id: string
        }
        Update: {
          artist?: string
          duration?: string
          id?: string
          played_at?: string | null
          title?: string
          track_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recently_played_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_state: {
        Row: {
          artist: string
          duration: string
          id: string
          playlist_json: string | null
          position_seconds: number | null
          title: string
          track_id: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          artist?: string
          duration?: string
          id?: string
          playlist_json?: string | null
          position_seconds?: number | null
          title: string
          track_id: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          artist?: string
          duration?: string
          id?: string
          playlist_json?: string | null
          position_seconds?: number | null
          title?: string
          track_id?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resume_state_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_mix_tracks: {
        Row: {
          artist: string
          duration: string
          id: string
          is_bridge: boolean | null
          mix_id: string
          position: number
          title: string
          track_id: string
          url: string
        }
        Insert: {
          artist?: string
          duration?: string
          id?: string
          is_bridge?: boolean | null
          mix_id: string
          position?: number
          title: string
          track_id: string
          url: string
        }
        Update: {
          artist?: string
          duration?: string
          id?: string
          is_bridge?: boolean | null
          mix_id?: string
          position?: number
          title?: string
          track_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_mix_tracks_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "saved_mixes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_mixes: {
        Row: {
          created_at: string | null
          id: string
          mix_type: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mix_type?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mix_type?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saved_mixes_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_playlists: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          share_token: string | null
          user_id: string
          vibe_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          user_id: string
          vibe_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          user_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          display_name: string | null
          id: string
          profile_image: string | null
          refresh_token: string | null
          spotify_user_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_image?: string | null
          refresh_token?: string | null
          spotify_user_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_image?: string | null
          refresh_token?: string | null
          spotify_user_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_flow: boolean | null
          id: string
          language: string | null
          shuffle: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_flow?: boolean | null
          id?: string
          language?: string | null
          shuffle?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_flow?: boolean | null
          id?: string
          language?: string | null
          shuffle?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tracks: {
        Row: {
          artist: string
          created_at: string | null
          duration: string
          energy: number | null
          id: string
          image: string | null
          is_bridge: boolean | null
          item_type: string | null
          metadata_fetched_at: string | null
          mood: string | null
          position: number
          source: string | null
          spotify_id: string | null
          spotify_url: string | null
          subtitle: string | null
          texture: string | null
          title: string
          track_id: string
          url: string
          user_id: string
          vibe_id: string
        }
        Insert: {
          artist?: string
          created_at?: string | null
          duration?: string
          energy?: number | null
          id?: string
          image?: string | null
          is_bridge?: boolean | null
          item_type?: string | null
          metadata_fetched_at?: string | null
          mood?: string | null
          position?: number
          source?: string | null
          spotify_id?: string | null
          spotify_url?: string | null
          subtitle?: string | null
          texture?: string | null
          title: string
          track_id: string
          url: string
          user_id: string
          vibe_id: string
        }
        Update: {
          artist?: string
          created_at?: string | null
          duration?: string
          energy?: number | null
          id?: string
          image?: string | null
          is_bridge?: boolean | null
          item_type?: string | null
          metadata_fetched_at?: string | null
          mood?: string | null
          position?: number
          source?: string | null
          spotify_id?: string | null
          spotify_url?: string | null
          subtitle?: string | null
          texture?: string | null
          title?: string
          track_id?: string
          url?: string
          user_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vibes: {
        Row: {
          color: string
          created_at: string | null
          description: string
          emoji: string
          id: string
          name: string
          position: number
          user_id: string
          vibe_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string
          emoji?: string
          id?: string
          name: string
          position?: number
          user_id: string
          vibe_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string
          emoji?: string
          id?: string
          name?: string
          position?: number
          user_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vibes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
