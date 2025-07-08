// frontend/src/app/api/bookings/[bookingId]/passengers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

type Passenger = {
  id: string;
  first_name: string;
  last_name: string;
  passenger_type: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const { data: passengers, error } = await supabase
    .from('passengers')
    .select('id, first_name, last_name, passenger_type')
    .eq('booking_id', bookingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ passengers: passengers as Passenger[] });
}