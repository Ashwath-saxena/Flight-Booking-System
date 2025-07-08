// frontend/src/app/api/flights/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';
import { DateTime } from 'luxon';

// --- Type Definitions ---

interface AirportData {
  id?: number;
  code?: string;
  city?: string;
}

interface SupabaseFlightData {
  id: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  available_seats: Record<string, number>;
  origin: AirportData | AirportData[] | null;
  destination: AirportData | AirportData[] | null;
}

interface ProcessedFlight {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  cabin_class: string;
  available_seats: number;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: 'one-way' | 'round-trip';
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'Economy' | 'Premium Economy' | 'Business' | 'First';
}

type ErrorResponse = {
  message: string;
};

// --- Helper Functions ---

function getAirlineFromFlightNumber(flightNumber: string): string {
  const airlineCode = flightNumber.substring(0, 2);
  switch (airlineCode) {
    case 'AI':
      return 'Air India';
    case 'SG':
      return 'SpiceJet';
    case '6E':
      return 'IndiGo';
    case 'UK':
      return 'Vistara';
    case 'G8':
      return 'GoAir';
    default:
      return airlineCode;
  }
}

function extractAirportField(
  airport: AirportData | AirportData[] | null,
  field: keyof AirportData
): string | number | undefined {
  if (!airport) return undefined;
  if (Array.isArray(airport)) {
    return airport.length > 0 ? (airport[0][field] ?? undefined) : undefined;
  }
  return airport[field];
}

function processFlights(
  flightsData: SupabaseFlightData[] | null,
  totalPassengers: number,
  cabinClass: string
): ProcessedFlight[] {
  const result: ProcessedFlight[] = [];

  if (!flightsData || !Array.isArray(flightsData)) {
    return result;
  }

  for (const flight of flightsData) {
    const availableSeats = flight.available_seats?.[cabinClass] ?? 0;
    if (availableSeats < totalPassengers) {
      continue;
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

    // Extract fields safely with type guards
    const originCode = extractAirportField(flight.origin, 'code');
    const destinationCode = extractAirportField(flight.destination, 'code');
    const originCity = extractAirportField(flight.origin, 'city');
    const destinationCity = extractAirportField(flight.destination, 'city');

    const departure_airport =
      typeof originCity === 'string' && originCity
        ? originCity
        : typeof originCode !== 'undefined'
          ? String(originCode)
          : 'Unknown';

    const arrival_airport =
      typeof destinationCity === 'string' && destinationCity
        ? destinationCity
        : typeof destinationCode !== 'undefined'
          ? String(destinationCode)
          : 'Unknown';

    const airlineName = getAirlineFromFlightNumber(flight.flight_number);

    result.push({
      id: flight.id,
      flight_number: flight.flight_number,
      airline: airlineName,
      departure_airport,
      arrival_airport,
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      duration: durationStr,
      price,
      cabin_class: cabinClass,
      available_seats: availableSeats
    });
  }

  return result;
}

// --- API Handler ---

export async function POST(request: NextRequest) {
  try {
    const searchParams = await request.json() as SearchParams;
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      tripType,
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'Economy'
    } = searchParams;

    if (!origin || !destination || !departureDate || !tripType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    if (tripType === 'round-trip' && !returnDate) {
      return NextResponse.json({ error: 'Return date is required for round-trip' }, { status: 400 });
    }
    const totalPassengers = adults + children + infants;
    if (totalPassengers <= 0) {
      return NextResponse.json({ error: 'At least one passenger is required' }, { status: 400 });
    }

    // --- Date handling with type safety ---
    const formattedDepartureDate = DateTime.fromISO(departureDate).toISODate();
    if (!formattedDepartureDate) {
      return NextResponse.json({ error: 'Invalid departure date format.' }, { status: 400 });
    }
    const departureStart = `${formattedDepartureDate}T00:00:00`;
    const nextDepartureDate = DateTime.fromISO(formattedDepartureDate).plus({ days: 1 }).toISODate();
    if (!nextDepartureDate) {
      return NextResponse.json({ error: 'Invalid departure date for range.' }, { status: 400 });
    }
    const departureEnd = `${nextDepartureDate}T00:00:00`;

    // Normalize city input (trim and Title Case for matching)
    const normalizeCity = (input: string) =>
      input.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    const normOrigin = normalizeCity(origin);
    const normDestination = normalizeCity(destination);

    // --- 1. Lookup airport IDs for the given cities ---
    const [originAirport, destinationAirport] = await Promise.all([
      supabase.from('airports').select('id, code, city').ilike('city', normOrigin).maybeSingle(),
      supabase.from('airports').select('id, code, city').ilike('city', normDestination).maybeSingle()
    ]);

    if (originAirport.error || destinationAirport.error || !originAirport.data || !destinationAirport.data) {
      return NextResponse.json({ error: 'Invalid origin or destination city.' }, { status: 400 });
    }

    // --- 2. Query flights by origin_id/destination_id ---
    // Use date range: [YYYY-MM-DDT00:00:00, next day T00:00:00)
    const { data: outboundFlightsData, error: outboundError } = await supabase
      .from('flights')
      .select(`
        id,
        flight_number,
        departure_time,
        arrival_time,
        base_price,
        available_seats,
        origin:airports!flights_origin_id_fkey(id, code, city),
        destination:airports!flights_destination_id_fkey(id, code, city)
      `)
      .eq('origin_id', originAirport.data.id)
      .eq('destination_id', destinationAirport.data.id)
      .gte('departure_time', departureStart)
      .lt('departure_time', departureEnd)
      .order('departure_time', { ascending: true });

    if (outboundError) {
      console.error('Error fetching outbound flights:', outboundError);
      return NextResponse.json({ error: outboundError.message }, { status: 500 });
    }

    const outboundFlights = processFlights(
      outboundFlightsData as SupabaseFlightData[],
      totalPassengers,
      cabinClass
    );

    // For round-trip, also fetch return flights
    let returnFlights: ProcessedFlight[] = [];
    if (tripType === 'round-trip' && returnDate) {
      const formattedReturnDate = DateTime.fromISO(returnDate).toISODate();
      if (!formattedReturnDate) {
        return NextResponse.json({ error: 'Invalid return date format.' }, { status: 400 });
      }
      const returnStart = `${formattedReturnDate}T00:00:00`;
      const nextReturnDate = DateTime.fromISO(formattedReturnDate).plus({ days: 1 }).toISODate();
      if (!nextReturnDate) {
        return NextResponse.json({ error: 'Invalid return date for range.' }, { status: 400 });
      }
      const returnEnd = `${nextReturnDate}T00:00:00`;

      const { data: returnFlightsData, error: returnError } = await supabase
        .from('flights')
        .select(`
          id,
          flight_number,
          departure_time,
          arrival_time,
          base_price,
          available_seats,
          origin:airports!flights_origin_id_fkey(id, code, city),
          destination:airports!flights_destination_id_fkey(id, code, city)
        `)
        .eq('origin_id', destinationAirport.data.id)
        .eq('destination_id', originAirport.data.id)
        .gte('departure_time', returnStart)
        .lt('departure_time', returnEnd)
        .order('departure_time', { ascending: true });

      if (returnError) {
        console.error('Error fetching return flights:', returnError);
        return NextResponse.json({ error: returnError.message }, { status: 500 });
      }

      returnFlights = processFlights(
        returnFlightsData as SupabaseFlightData[],
        totalPassengers,
        cabinClass
      );
    }

    // Return the results
    return NextResponse.json({
      outboundFlights,
      returnFlights,
      params: {
        origin: normOrigin,
        destination: normDestination,
        departureDate,
        returnDate,
        tripType,
        cabinClass,
        passengers: {
          adults,
          children,
          infants,
          total: totalPassengers
        }
      }
    });
  } catch (error: unknown) {
    const typedError = error as ErrorResponse;
    console.error('Error searching flights:', typedError);
    return NextResponse.json({
      error: typedError.message || 'Failed to search for flights'
    }, { status: 500 });
  }
}