// frontend/src/app/api/bookings/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';
import { sendServerEmail } from "@/app/actions/email";

type ErrorType = { message: string };

// Helper to normalize airport join result from Supabase (object or [{...}])
const getAirportField = (airport: any, field: "code" | "city") => {
  if (!airport) return "";
  if (Array.isArray(airport)) return airport[0]?.[field] || "";
  return airport[field] || "";
};

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    const { 
      flightId, 
      cabinClass, 
      passengers, 
      passengerInfo, 
      totalAmount,
      userId
    } = bookingData;
    
    if (!flightId || !cabinClass || !passengers || !passengerInfo || !totalAmount || !userId) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
    }
    
    // Check flight & seat availability
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select(`
        id, 
        available_seats,
        flight_number,
        departure_time,
        arrival_time,
        origin:airports!flights_origin_id_fkey(code, city),
        destination:airports!flights_destination_id_fkey(code, city)
      `)
      .eq('id', flightId)
      .single();
    
    if (flightError || !flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    
    const availableSeats = flight.available_seats?.[cabinClass] || 0;
    if (availableSeats < passengers.total) {
      return NextResponse.json({ 
        error: `Not enough seats available. Only ${availableSeats} seats left in ${cabinClass} class.` 
      }, { status: 400 });
    }
    
    // Create booking as "Pending"
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: userId,
          user_email: passengerInfo.email,
          flight_id: flightId,
          booking_status: 'Pending',
          total_amount: totalAmount,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
    
    if (bookingError) {
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
    
    // Create passenger records
    const passengerRecords = [];
    passengerRecords.push({
      booking_id: booking.id,
      first_name: passengerInfo.firstName,
      last_name: passengerInfo.lastName,
      passenger_type: 'Adult',
      date_of_birth: passengerInfo.dateOfBirth || '1990-01-01',
      passport_number: passengerInfo.passportNumber || null,
      cabin_class: cabinClass,
    });
    for (let i = 1; i < passengers.adults; i++) {
      passengerRecords.push({
        booking_id: booking.id,
        first_name: `Adult ${i+1}`,
        last_name: passengerInfo.lastName,
        passenger_type: 'Adult',
        date_of_birth: '1990-01-01',
        passport_number: null,
        cabin_class: cabinClass,
      });
    }
    for (let i = 0; i < passengers.children; i++) {
      passengerRecords.push({
        booking_id: booking.id,
        first_name: `Child ${i+1}`,
        last_name: passengerInfo.lastName,
        passenger_type: 'Child',
        date_of_birth: '2015-01-01',
        passport_number: null,
        cabin_class: cabinClass,
      });
    }
    for (let i = 0; i < passengers.infants; i++) {
      passengerRecords.push({
        booking_id: booking.id,
        first_name: `Infant ${i+1}`,
        last_name: passengerInfo.lastName,
        passenger_type: 'Infant',
        date_of_birth: '2023-01-01',
        passport_number: null,
        cabin_class: cabinClass,
      });
    }
    await supabase.from('passengers').insert(passengerRecords);

    // Subtract seats
    const updatedSeats = { ...flight.available_seats };
    updatedSeats[cabinClass] = availableSeats - passengers.total;
    await supabase
      .from('flights')
      .update({ available_seats: updatedSeats })
      .eq('id', flightId);

    // Send confirmation email
    try {
      await sendServerEmail(
        {
          booking: {
            id: booking.id,
            booking_status: booking.booking_status,
            total_amount: booking.total_amount,
            booking_date: booking.created_at,
            flight: {
              id: flight.id,
              flight_number: flight.flight_number,
              airline: "Flight Booker Airways",
              departure_time: flight.departure_time,
              arrival_time: flight.arrival_time,
              origin: {
                code: getAirportField(flight.origin, "code"),
                city: getAirportField(flight.origin, "city"),
              },
              destination: {
                code: getAirportField(flight.destination, "code"),
                city: getAirportField(flight.destination, "city"),
              },
            },
            passengers: passengerRecords.map((p) => ({
              first_name: p.first_name,
              last_name: p.last_name,
              passenger_type: p.passenger_type,
              cabin_class: p.cabin_class,
            })),
          },
          userEmail: passengerInfo.email || "",
        },
        "confirmation"
      );
    } catch (err) {
      // Optionally log, but do not fail booking if email fails
      console.error("Failed to send confirmation email:", err);
    }

    return NextResponse.json({
      id: booking.id,
      status: booking.booking_status,
      message: 'Booking created successfully',
      bookingDate: booking.booking_date
    });
    
  } catch (error: unknown) {
    const typedError = error as ErrorType;
    return NextResponse.json({ 
      error: typedError.message || 'An error occurred while processing your booking' 
    }, { status: 500 });
  }
}

// --- CANCELLATION HANDLER (PATCH method) ---
export async function PATCH(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Fetch booking with related flight and passengers
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flight:flights!bookings_flight_id_fkey(
          id,
          flight_number,
          departure_time,
          arrival_time,
          origin:airports!flights_origin_id_fkey(code, city),
          destination:airports!flights_destination_id_fkey(code, city),
          available_seats
        ),
        passengers(
          first_name,
          last_name,
          passenger_type,
          cabin_class
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Restore seats to flight
    const seatsByClass: Record<string, number> = {};
    (booking.passengers || []).forEach((p: { cabin_class: string }) => {
      seatsByClass[p.cabin_class] = (seatsByClass[p.cabin_class] || 0) + 1;
    });

    const updatedSeats = { ...booking.flight.available_seats };
    Object.entries(seatsByClass).forEach(([cabinClass, count]) => {
      updatedSeats[cabinClass] = (updatedSeats[cabinClass] || 0) + count;
    });

    // Update booking status and flight seat counts (could use transaction/rpc in production)
    const { error: cancelError } = await supabase
      .from("bookings")
      .update({ booking_status: "Cancelled" })
      .eq("id", bookingId);

    if (cancelError) {
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
    }

    await supabase
      .from("flights")
      .update({ available_seats: updatedSeats })
      .eq("id", booking.flight.id);

    // Send cancellation email
    try {
      await sendServerEmail(
        {
          booking: {
            id: booking.id,
            booking_status: "Cancelled",
            total_amount: booking.total_amount,
            booking_date: booking.created_at,
            flight: {
              id: booking.flight.id,
              flight_number: booking.flight.flight_number,
              airline: "Flight Booker Airways",
              departure_time: booking.flight.departure_time,
              arrival_time: booking.flight.arrival_time,
              origin: {
                code: getAirportField(booking.flight.origin, "code"),
                city: getAirportField(booking.flight.origin, "city"),
              },
              destination: {
                code: getAirportField(booking.flight.destination, "code"),
                city: getAirportField(booking.flight.destination, "city"),
              },
            },
            passengers: (booking.passengers || []).map((p: any) => ({
              first_name: p.first_name,
              last_name: p.last_name,
              passenger_type: p.passenger_type,
              cabin_class: p.cabin_class,
            })),
          },
          userEmail: booking.user_email || "",
        },
        "cancellation"
      );
    } catch (err) {
      // Optionally log, but do not fail cancellation if email fails
      console.error("Failed to send cancellation email:", err);
    }

    return NextResponse.json({ status: "Cancelled", message: "Booking cancelled successfully." });
  } catch (error: unknown) {
    const typedError = error as ErrorType;
    return NextResponse.json({
      error: typedError.message || "An error occurred while cancelling your booking",
    }, { status: 500 });
  }
}