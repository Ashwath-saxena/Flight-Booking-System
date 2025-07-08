// frontend/src/app/api/flights/[flightId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

// Define the response structure
interface FlightResponse {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_airport_name: string;
  arrival_airport_name: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  cabin_class: string;
  available_seats: number;
}

// Define error type
type ErrorType = {
  message: string;
};

// Define origin/destination type
interface AirportDetails {
  code?: string;
  name?: string;
  city?: string;
}

/**
 * Get flight details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    // Await params to get the flightId
    const { flightId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cabinClass = searchParams.get('cabinClass') || 'Economy';

    if (!flightId) {
      return NextResponse.json({ error: 'Flight ID is required' }, { status: 400 });
    }

    // Fetch flight details from database
    const { data: flight, error } = await supabase
      .from('flights')
      .select(`
        id,
        flight_number,
        departure_time,
        arrival_time,
        base_price,
        available_seats,
        origin:airports!flights_origin_id_fkey(code,name,city),
        destination:airports!flights_destination_id_fkey(code,name,city)
      `)
      .eq('id', flightId)
      .single();

    if (error) {
      console.error('Error fetching flight:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    // Calculate duration
    const departureTime = new Date(flight.departure_time);
    const arrivalTime = new Date(flight.arrival_time);
    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = `${hours}h ${minutes}m`;

    // Calculate price based on cabin class
    let price = flight.base_price;
    switch (cabinClass) {
      case 'Premium Economy':
        price *= 1.5;
        break;
      case 'Business':
        price *= 2.5;
        break;
      case 'First':
        price *= 4;
        break;
    }

    // Determine airline from flight number
    const airlineCode = flight.flight_number.substring(0, 2);
    let airline = airlineCode;
    switch (airlineCode) {
      case 'AI':
        airline = 'Air India';
        break;
      case 'SG':
        airline = 'SpiceJet';
        break;
      case '6E':
        airline = 'IndiGo';
        break;
      case 'UK':
        airline = 'Vistara';
        break;
      case 'G8':
        airline = 'GoAir';
        break;
    }

    // Extract airport information
    let origin: AirportDetails = {};
    let destination: AirportDetails = {};

    if (flight.origin) {
      // Handle both object and array cases
      if (Array.isArray(flight.origin)) {
        if (flight.origin.length > 0) {
          origin = flight.origin[0];
        }
      } else {
        origin = flight.origin;
      }
    }

    if (flight.destination) {
      // Handle both object and array cases
      if (Array.isArray(flight.destination)) {
        if (flight.destination.length > 0) {
          destination = flight.destination[0];
        }
      } else {
        destination = flight.destination;
      }
    }

    // Format response
    const flightDetails: FlightResponse = {
      id: flight.id,
      flight_number: flight.flight_number,
      airline,
      departure_airport: origin.code || 'Unknown',
      arrival_airport: destination.code || 'Unknown',
      departure_airport_name: origin.name || 'Unknown',
      arrival_airport_name: destination.name || 'Unknown',
      departure_city: origin.city || 'Unknown',
      arrival_city: destination.city || 'Unknown',
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      duration: durationStr,
      price,
      cabin_class: cabinClass,
      available_seats: flight.available_seats?.[cabinClass] || 0
    };

    return NextResponse.json(flightDetails);
  } catch (error: unknown) {
    const typedError = error as ErrorType;
    console.error('Error in flight details API:', typedError);
    return NextResponse.json({ error: typedError.message || 'Server error' }, { status: 500 });
  }
}