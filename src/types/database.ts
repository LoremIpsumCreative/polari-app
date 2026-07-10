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
      collection_words: {
        Row: {
          collection_id: string
          sort_order: number
          word_id: string
        }
        Insert: {
          collection_id: string
          sort_order?: number
          word_id: string
        }
        Update: {
          collection_id?: string
          sort_order?: number
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_words_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          accent: string | null
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
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
          streak_freezes: number
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
      user_word_progress: {
        Row: {
          created_at: string
          due_at: string | null
          ease: number
          interval_days: number
          lapses: number
          last_reviewed_at: string | null
          mastery: number
          reps: number
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          ease?: number
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          mastery?: number
          reps?: number
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          ease?: number
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          mastery?: number
          reps?: number
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          audio_url: string | null
          created_at: string
          cultural_context: string | null
          definition: string
          difficulty: number | null
          entry_type: string
          example: string | null
          id: string
          notes_variants: string | null
          origin: string | null
          part_of_speech: string | null
          pronunciation: string | null
          register: string | null
          related_slugs: string[] | null
          search_text: string | null
          sensitivity_note: string | null
          slug: string
          sort_order: number
          term: string
          usage_status: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          cultural_context?: string | null
          definition: string
          difficulty?: number | null
          entry_type: string
          example?: string | null
          id?: string
          notes_variants?: string | null
          origin?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          register?: string | null
          related_slugs?: string[] | null
          search_text?: string | null
          sensitivity_note?: string | null
          slug: string
          sort_order: number
          term: string
          usage_status?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          cultural_context?: string | null
          definition?: string
          difficulty?: number | null
          entry_type?: string
          example?: string | null
          id?: string
          notes_variants?: string | null
          origin?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          register?: string | null
          related_slugs?: string[] | null
          search_text?: string | null
          sensitivity_note?: string | null
          slug?: string
          sort_order?: number
          term?: string
          usage_status?: string | null
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
          streak_freezes: number
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
export type Collection = Tables<"collections">
export type UserWordProgress = Tables<"user_word_progress">

// 'current' — still heard today · 'rare' — occasionally heard · 'historical' — of its era
export type UsageStatus = "current" | "rare" | "historical"
