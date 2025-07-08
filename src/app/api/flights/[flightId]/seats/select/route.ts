// frontend/src/app/api/flights/[flightId]/seats/select/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

type Seat = {
  seat_number: string;
  status: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { flightId: string } }
) {
  const { seatNumbers, bookingId, passengerIds } = await request.json();

  // 👇 Await params!
  const { flightId } = await params;

  // 1. Check seat availability
  const { data: seats, error: seatError } = await supabase
    .from('seats')
    .select('seat_number, status')
    .eq('flight_id', flightId)
    .in('seat_number', seatNumbers);

  if (seatError)
    return NextResponse.json({ error: seatError.message }, { status: 500 });

  const unavailable = (seats as Seat[]).filter((s) => s.status !== 'available');
  if (unavailable.length > 0)
    return NextResponse.json({ error: 'One or more seats are already taken.' }, { status: 409 });

  // 2. Assign seats to passengers and mark as booked
  for (let i = 0; i < seatNumbers.length; i++) {
    const updates: {
      status: string;
      booking_id: string;
      passenger_id?: string;
    } = {
      status: 'booked',
      booking_id: bookingId,
    };
    if (passengerIds && passengerIds[i]) {
      updates.passenger_id = passengerIds[i];
    }
    await supabase
      .from('seats')
      .update(updates)
      .eq('flight_id', flightId)
      .eq('seat_number', seatNumbers[i]);
  }

  // 3. Confirm the booking after seat assignment
  await supabase
    .from('bookings')
    .update({ booking_status: 'Confirmed' })
    .eq('id', bookingId);

  return NextResponse.json({ success: true });
}