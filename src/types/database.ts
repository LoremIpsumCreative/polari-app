export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      favourites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          app_version: string | null
          category: string | null
          contact_email: string | null
          created_at: string
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score: number
          total_questions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          words_learned_count: number
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          words_learned_count?: number
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          words_learned_count?: number
        }
        Relationships: []
      }
      words: {
        Row: {
          created_at: string
          definition: string
          entry_type: string
          example: string | null
          id: string
          notes_variants: string | null
          origin: string | null
          part_of_speech: string | null
          pronunciation: string | null
          search_text: string | null
          slug: string
          sort_order: number
          term: string
        }
        Insert: {
          created_at?: string
          definition: string
          entry_type: string
          example?: string | null
          id?: string
          notes_variants?: string | null
          origin?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          search_text?: string | null
          slug: string
          sort_order: number
          term: string
        }
        Update: {
          created_at?: string
          definition?: string
          entry_type?: string
          example?: string | null
          id?: string
          notes_variants?: string | null
          origin?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          search_text?: string | null
          slug?: string
          sort_order?: number
          term?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_daily_engagement: {
        Args: never
        Returns: {
          current_streak: number
          longest_streak: number
          words_learned_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

export type Word = Tables<"words">
