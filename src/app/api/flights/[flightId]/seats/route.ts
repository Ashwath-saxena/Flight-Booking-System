// frontend/src/app/api/flights/[flightId]/seats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  // 👇 Await params!
  const { flightId } = await params;

  const { data: seats, error } = await supabase
    .from('seats')
    .select('id, seat_number, cabin_class, status, booking_id, passenger_id')
    .eq('flight_id', flightId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seats });
}