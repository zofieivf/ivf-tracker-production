import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient()
}

// Server-side Supabase client for Server Components
export const createServerClient = () => {
  return createServerComponentClient({ cookies })
}

// Server-side Supabase client for API routes
export const createRouteHandlerSupabaseClient = () => {
  return createRouteHandlerClient({ cookies })
}

// Database types will be generated automatically by Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          location?: string
          date_of_birth?: string
          ivf_reasons: string[]
          ivf_reason_other?: string
          genetic_reasons_details?: string
          living_children: number
          children_from_ivf?: string
          number_of_ivf_children?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location?: string
          date_of_birth?: string
          ivf_reasons: string[]
          ivf_reason_other?: string
          genetic_reasons_details?: string
          living_children: number
          children_from_ivf?: string
          number_of_ivf_children?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location?: string
          date_of_birth?: string
          ivf_reasons?: string[]
          ivf_reason_other?: string
          genetic_reasons_details?: string
          living_children?: number
          children_from_ivf?: string
          number_of_ivf_children?: number
          created_at?: string
          updated_at?: string
        }
      }
      ivf_cycles: {
        Row: {
          id: string
          user_id: string
          name: string
          start_date: string
          end_date?: string
          protocol?: string
          clinic?: string
          notes?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          start_date: string
          end_date?: string
          protocol?: string
          clinic?: string
          notes?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          start_date?: string
          end_date?: string
          protocol?: string
          clinic?: string
          notes?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Additional tables will be added for cycle_days, medications, etc.
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
  }
}