// frontend/src/app/api/bookings/history/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {  // Removed 'request' parameter
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's bookings with related data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(
          *,
          origin:airports!flights_origin_id_fkey(code, city, name),
          destination:airports!flights_destination_id_fkey(code, city, name)
        ),
        passengers(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Error in bookings history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}