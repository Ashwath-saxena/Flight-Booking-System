// frontend/src/app/api/flights/[flightId]/status/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendFlightStatusUpdateEmail } from '@/app/actions/email';

interface FlightData {
  id: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  origin: {
    code: string;
    city: string;
    name: string;
  };
  destination: {
    code: string;
    city: string;
    name: string;
  };
}

interface FlightStatus {
  status: string;
  message: string;
  color: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  delay?: number;
  gate?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

interface FlightStatusUpdate {
  status?: string;
  delay?: number;
  gate?: string;
  message?: string;
  timestamp: string;
  updatedBy: string;
}

interface SavedFlightStatus {
  id: string;
  flight_id: string;
  status: string;
  message: string;
  delay_minutes: number;
  gate: string | null;
  updated_by: string | null;
  created_at: string;
}

interface BookingUser {
  id: string;
  user_email: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { flightId } = await params;
    const { data: flight, error } = await supabase
      .from('flights')
      .select(`
        *,
        origin:airports!flights_origin_id_fkey(code, city, name),
        destination:airports!flights_destination_id_fkey(code, city, name)
      `)
      .eq('id', flightId)
      .single();

    if (error) throw error;

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    const flightData = flight as FlightData;

    const { data: savedStatus } = await supabase
      .from('flight_status_updates')
      .select('*')
      .eq('flight_id', flightId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let status: FlightStatus;

    if (savedStatus) {
      const savedData = savedStatus as SavedFlightStatus;
      const estimatedDeparture = new Date(flightData.departure_time);
      const estimatedArrival = new Date(flightData.arrival_time);

      if (savedData.delay_minutes > 0) {
        estimatedDeparture.setMinutes(estimatedDeparture.getMinutes() + savedData.delay_minutes);
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + savedData.delay_minutes);
      }

      status = {
        status: savedData.status,
        message: savedData.message,
        color: getStatusColor(savedData.status),
        estimatedDeparture: estimatedDeparture.toISOString(),
        estimatedArrival: estimatedArrival.toISOString(),
        delay: savedData.delay_minutes || 0,
        gate: savedData.gate || undefined,
        lastUpdated: savedData.created_at,
        updatedBy: savedData.updated_by || undefined
      };
    } else {
      status = generateFlightStatus(flightData);
    }

    return NextResponse.json({
      flightId: flightId,
      status: status,
      flight: flightData,
      lastUpdated: '2025-07-07 09:03:14',
      updatedBy: 'Ashwath-saxena'
    });
  } catch (error) {
    console.error('Error fetching flight status:', error);
    return NextResponse.json({ error: 'Failed to fetch flight status' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { flightId } = await params;
    const body = await request.json();
    const { status, delay, gate, message } = body;

    // Save the status update to database
    const { data: savedUpdate, error: saveError } = await supabase
      .from('flight_status_updates')
      .insert({
        flight_id: flightId,
        status: status,
        message: message,
        delay_minutes: delay || 0,
        gate: gate || null,
        updated_by: session.user.email || 'system'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving flight status:', saveError);
      throw new Error('Failed to save flight status update');
    }

    // Get flight details for email
    const { data: flightData } = await supabase
      .from('flights')
      .select(`
        *,
        origin:airports!flights_origin_id_fkey(code, city, name),
        destination:airports!flights_destination_id_fkey(code, city, name)
      `)
      .eq('id', flightId)
      .single();

    // Get all users who have booked this flight (now using user_email)
    const { data: bookingUsers } = await supabase
      .from('bookings')
      .select('id, user_email')
      .eq('flight_id', flightId)
      .eq('booking_status', 'Confirmed');

    console.log('[FlightStatus POST] Bookings found:', bookingUsers);

    let normalizedBookingUsers: BookingUser[] = [];
    if (bookingUsers && Array.isArray(bookingUsers)) {
      normalizedBookingUsers = bookingUsers.filter(
        (booking: any) => booking.user_email && booking.user_email !== ''
      );
    }

    if (flightData && normalizedBookingUsers.length > 0) {
      const flight = flightData as FlightData;
      const route = `${flight.origin.city} (${flight.origin.code}) → ${flight.destination.city} (${flight.destination.code})`;
      const { data: previousStatusArr } = await supabase
        .from('flight_status_updates')
        .select('status')
        .eq('flight_id', flightId)
        .order('created_at', { ascending: false })
        .limit(2);

      const prevStatus =
        Array.isArray(previousStatusArr) && previousStatusArr.length > 1
          ? previousStatusArr[1]?.status
          : undefined;

      console.log(`[FlightStatus POST] Will send status update to ${normalizedBookingUsers.length} users...`);

      const emailPromises = normalizedBookingUsers.map(async (booking) => {
        if (booking.user_email) {
          const emailData = {
            userEmail: booking.user_email,
            userName: '', // (optional: you may want to store user name in bookings)
            flightNumber: flight.flight_number,
            flightId: flight.id,
            bookingId: booking.id, // <-- use id, not booking_id
            route: route,
            departureTime: flight.departure_time,
            arrivalTime: flight.arrival_time,
            statusUpdate: {
              previousStatus: prevStatus,
              newStatus: status,
              message: message,
              delay: delay || 0,
              gate: gate,
              updatedBy: session.user.email || 'system',
              timestamp: new Date().toISOString(),
            },
          };
          console.log('[FlightStatus POST] Sending email with data:', emailData);
          try {
            const result = await sendFlightStatusUpdateEmail(emailData);
            if (result.success) {
              console.log(`[FlightStatus POST] Email sent successfully to ${booking.user_email}`);
            } else {
              console.error(`[FlightStatus POST] Failed to send email to ${booking.user_email}:`, result.error);
            }
            return result;
          } catch (error) {
            console.error(`[FlightStatus POST] Error sending email to ${booking.user_email}:`, error);
            return { success: false, error };
          }
        } else {
          console.warn(`[FlightStatus POST] Booking with id=${booking.id} is missing email, skipping`);
          return { success: false, error: 'No email address' };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success) {
          console.log('[FlightStatus POST] Email sent successfully');
        } else {
          console.error('[FlightStatus POST] Email sending error:', r);
        }
      });
    } else {
      console.warn('[FlightStatus POST] No bookings found or flight data missing; no emails sent.');
    }

    // Broadcast SSE (unchanged)
    const update: FlightStatusUpdate = {
      status: status,
      delay: delay,
      gate: gate,
      message: message,
      timestamp: new Date().toISOString(),
      updatedBy: session.user.email || 'system',
    };

    const { broadcastFlightUpdate } = await import('@/utils/flightStatusBroadcast');
    broadcastFlightUpdate(flightId, update);

    return NextResponse.json({
      success: true,
      flightId: flightId,
      update: update,
      saved: savedUpdate,
      emailsSent: normalizedBookingUsers.length,
    });
  } catch (error) {
    console.error('[FlightStatus POST] Error updating flight status:', error);
    return NextResponse.json({ error: 'Failed to update flight status' }, { status: 500 });
  }
}

function generateFlightStatus(flight: FlightData): FlightStatus {
  const now = new Date('2025-07-07 09:03:14');
  const departureTime = new Date(flight.departure_time);
  const arrivalTime = new Date(flight.arrival_time);

  const timeToDeparture = departureTime.getTime() - now.getTime();
  const timeToArrival = arrivalTime.getTime() - now.getTime();

  if (timeToDeparture > 2 * 60 * 60 * 1000) {
    return {
      status: 'Scheduled',
      message: 'Flight is on schedule',
      color: 'green',
      estimatedDeparture: flight.departure_time,
      estimatedArrival: flight.arrival_time
    };
  } else if (timeToDeparture > 0) {
    return {
      status: 'Boarding',
      message: 'Boarding in progress',
      color: 'blue',
      estimatedDeparture: flight.departure_time,
      estimatedArrival: flight.arrival_time
    };
  } else if (timeToArrival > 0) {
    return {
      status: 'In Flight',
      message: 'Flight is in the air',
      color: 'purple',
      estimatedDeparture: flight.departure_time,
      estimatedArrival: flight.arrival_time
    };
  } else {
    return {
      status: 'Arrived',
      message: 'Flight has arrived',
      color: 'gray',
      estimatedDeparture: flight.departure_time,
      estimatedArrival: flight.arrival_time
    };
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled': return 'green';
    case 'boarding': return 'blue';
    case 'delayed': return 'yellow';
    case 'in flight': return 'purple';
    case 'arrived': return 'gray';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
}