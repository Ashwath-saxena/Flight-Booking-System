// frontend/src/app/api/bookings/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type ErrorResponse = {
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user
    const cookieStore = cookies();
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // First, get the booking to check if it belongs to the user and get flight info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, flight:flights(id, available_seats), passengers(cabin_class)')
      .eq('id', bookingId)
      .single();
      
    if (bookingError) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check if booking belongs to the authenticated user
    if (booking.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this booking' }, { status: 403 });
    }
    
    // Check if booking is already cancelled
    if (booking.booking_status === 'Cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }
    
    // Start a transaction to update booking status and restore available seats
    const { error: cancelError } = await supabase.rpc('cancel_booking', {
      booking_id: bookingId
    });
    
    if (cancelError) {
      return NextResponse.json({ error: 'Failed to cancel booking: ' + cancelError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      bookingId: bookingId
    });
    
  } catch (error: unknown) {
    const typedError = error as ErrorResponse;
    console.error('Error cancelling booking:', typedError);
    return NextResponse.json({ 
      error: typedError.message || 'Failed to cancel booking' 
    }, { status: 500 });
  }
}