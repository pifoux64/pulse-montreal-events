import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


// Types pour les tables Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'organizer' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'user' | 'organizer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'user' | 'organizer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          short_description: string | null;
          start_date: string;
          end_date: string;
          location_name: string;
          location_address: string;
          location_city: string;
          location_postal_code: string;
          location_lat: number;
          location_lng: number;
          category: string;
          sub_category: string | null;
          tags: string[];
          price_amount: number;
          price_currency: string;
          price_is_free: boolean;
          image_url: string | null;
          ticket_url: string | null;
          organizer_id: string;
          max_capacity: number | null;
          current_attendees: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          short_description?: string | null;
          start_date: string;
          end_date: string;
          location_name: string;
          location_address: string;
          location_city: string;
          location_postal_code: string;
          location_lat: number;
          location_lng: number;
          category: string;
          sub_category?: string | null;
          tags?: string[];
          price_amount: number;
          price_currency: string;
          price_is_free: boolean;
          image_url?: string | null;
          ticket_url?: string | null;
          organizer_id: string;
          max_capacity?: number | null;
          current_attendees?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          short_description?: string | null;
          start_date?: string;
          end_date?: string;
          location_name?: string;
          location_address?: string;
          location_city?: string;
          location_postal_code?: string;
          location_lat?: number;
          location_lng?: number;
          category?: string;
          sub_category?: string | null;
          tags?: string[];
          price_amount?: number;
          price_currency?: string;
          price_is_free?: boolean;
          image_url?: string | null;
          ticket_url?: string | null;
          organizer_id?: string;
          max_capacity?: number | null;
          current_attendees?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_filters: {
        Row: {
          id: string;
          name: string;
          value: string;
          type: 'text' | 'boolean' | 'select' | 'number';
          options: string[] | null;
          is_required: boolean;
          event_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          value: string;
          type: 'text' | 'boolean' | 'select' | 'number';
          options?: string[] | null;
          is_required?: boolean;
          event_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          value?: string;
          type?: 'text' | 'boolean' | 'select' | 'number';
          options?: string[] | null;
          is_required?: boolean;
          event_id?: string;
        };
      };
      accessibility: {
        Row: {
          id: string;
          event_id: string;
          wheelchair_accessible: boolean;
          hearing_assistance: boolean;
          visual_assistance: boolean;
          quiet_space: boolean;
          gender_neutral_bathrooms: boolean;
          other: string[];
        };
        Insert: {
          id?: string;
          event_id: string;
          wheelchair_accessible?: boolean;
          hearing_assistance?: boolean;
          visual_assistance?: boolean;
          quiet_space?: boolean;
          gender_neutral_bathrooms?: boolean;
          other?: string[];
        };
        Update: {
          id?: string;
          event_id?: string;
          wheelchair_accessible?: boolean;
          hearing_assistance?: boolean;
          visual_assistance?: boolean;
          quiet_space?: boolean;
          gender_neutral_bathrooms?: boolean;
          other?: string[];
        };
      };
      event_target_audience: {
        Row: {
          id: string;
          event_id: string;
          audience: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          audience: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          audience?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          name_en: string;
          icon: string;
          color: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en: string;
          icon: string;
          color: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string;
          icon?: string;
          color?: string;
        };
      };
      sub_categories: {
        Row: {
          id: string;
          name: string;
          name_en: string;
          category_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en: string;
          category_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string;
          category_id?: string;
        };
      };
    };
  };
}

export type SupabaseClient = ReturnType<typeof createClient<Database>>;
