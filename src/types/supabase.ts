// frontend/src/lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      airports: {
        Row: {
          id: number
          code: string
          name: string
          city: string
          country: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: number
          code: string
          name: string
          city: string
          country: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: number
          code?: string
          name?: string
          city?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
        }
      }
      flights: {
        Row: {
          id: string
          flight_number: string
          origin_id: number
          destination_id: number
          departure_time: string
          arrival_time: string
          base_price: number
          available_seats: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flight_number: string
          origin_id: number
          destination_id: number
          departure_time: string
          arrival_time: string
          base_price: number
          available_seats: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flight_number?: string
          origin_id?: number
          destination_id?: number
          departure_time?: string
          arrival_time?: string
          base_price?: number
          available_seats?: Json
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          flight_id: string
          booking_status: 'Pending' | 'Confirmed' | 'Cancelled'
          total_amount: number
          booking_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flight_id: string
          booking_status?: 'Pending' | 'Confirmed' | 'Cancelled'
          total_amount: number
          booking_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flight_id?: string
          booking_status?: 'Pending' | 'Confirmed' | 'Cancelled'
          total_amount?: number
          booking_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      passengers: {
        Row: {
          id: string
          booking_id: string
          first_name: string
          last_name: string
          passenger_type: 'Adult' | 'Child' | 'Infant'
          date_of_birth: string
          passport_number: string | null
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          first_name: string
          last_name: string
          passenger_type: 'Adult' | 'Child' | 'Infant'
          date_of_birth: string
          passport_number?: string | null
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          first_name?: string
          last_name?: string
          passenger_type?: 'Adult' | 'Child' | 'Infant'
          date_of_birth?: string
          passport_number?: string | null
          cabin_class?: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          date_of_birth: string | null
          address: string | null
          payment_methods: Json[]
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          address?: string | null
          payment_methods?: Json[]
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          address?: string | null
          payment_methods?: Json[]
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
      booking_status: 'Pending' | 'Confirmed' | 'Cancelled'
      passenger_type: 'Adult' | 'Child' | 'Infant'
    }
  }
}