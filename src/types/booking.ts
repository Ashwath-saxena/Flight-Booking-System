// frontend/src/types/booking.ts
import { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type BookingWithDetails = Tables['bookings']['Row'] & {
  flight: Tables['flights']['Row'] & {
    origin: Tables['airports']['Row'];
    destination: Tables['airports']['Row'];
  };
  passengers: Tables['passengers']['Row'][];
};