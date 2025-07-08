// frontend/src/types/index.ts
import { Database } from './supabase'

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

export type Airport = Tables['airports']['Row']
export type Flight = Tables['flights']['Row']
export type Booking = Tables['bookings']['Row']
export type Passenger = Tables['passengers']['Row']

export type CabinClass = Enums['cabin_class']
export type BookingStatus = Enums['booking_status']
export type PassengerType = Enums['passenger_type']

export type FlightSearchParams = {
  origin: string
  destination: string
  departureDate: string
  passengers: number
  cabinClass: CabinClass
}

export type FlightWithDetails = Flight & {
  origin: Airport
  destination: Airport
}