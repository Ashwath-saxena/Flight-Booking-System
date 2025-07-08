// frontend/src/app/api/flights/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addConnection, removeConnection } from '@/utils/flightStatusBroadcast';

export const runtime = 'nodejs';

// Define proper types
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

// Store active connections (removed - now handled by utility)

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const flightId = searchParams.get('flightId');
  const bookingId = searchParams.get('bookingId');

  // Create SSE stream
  let controller: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      
      // Store connection for this user/flight
      const connectionId = `${session.user.id}-${flightId || bookingId || 'all'}`;
      addConnection(connectionId, controller);
      
      // Send initial connection message
      const message = `data: ${JSON.stringify({
        type: 'connected',
        timestamp: '2025-07-07 08:33:03',
        user: 'Ashwath-saxena'
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(message));
      
      // Send initial flight status if flightId is provided
      if (flightId) {
        sendInitialFlightStatus(flightId, controller, supabase);
      }
    },
    cancel() {
      // Clean up connection
      const connectionId = `${session.user.id}-${flightId || bookingId || 'all'}`;
      removeConnection(connectionId);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

async function sendInitialFlightStatus(flightId: string, controller: ReadableStreamDefaultController, supabase: SupabaseClient) {
  try {
    const { data: flight, error } = await supabase
      .from('flights')
      .select(`
        *,
        origin:airports!flights_origin_id_fkey(code, city, name),
        destination:airports!flights_destination_id_fkey(code, city, name)
      `)
      .eq('id', flightId)
      .single();

    if (error) {
      console.error('Error fetching flight data:', error);
      return;
    }

    if (flight) {
      const flightData = flight as FlightData;
      
      // Check for saved status updates
      const { data: savedStatus } = await supabase
        .from('flight_status_updates')
        .select('*')
        .eq('flight_id', flightId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let status: FlightStatus;
      
      if (savedStatus) {
        // Use saved status if available
        const savedData = savedStatus as SavedFlightStatus;
        const estimatedDeparture = new Date(flightData.departure_time);
        const estimatedArrival = new Date(flightData.arrival_time);
        
        // Apply delay if present
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
          gate: savedData.gate || undefined
        };
      } else {
        // Generate status from flight times if no saved status
        status = generateFlightStatus(flightData);
      }
      
      const message = `data: ${JSON.stringify({
        type: 'flight_status',
        flightId: flightId,
        status: status,
        timestamp: '2025-07-07 08:33:03',
        flight: flightData
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(message));
    }
  } catch (error) {
    console.error('Error sending initial flight status:', error);
  }
}

function generateFlightStatus(flight: FlightData): FlightStatus {
  const now = new Date('2025-07-07 08:33:03');
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