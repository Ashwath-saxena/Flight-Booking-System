// frontend/src/app/api/dashboard/top-routes/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  // Get all bookings with flights and airports (force single-object join)
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      flight:flights!bookings_flight_id_fkey(
        origin:airports!flights_origin_id_fkey(code,city),
        destination:airports!flights_destination_id_fkey(code,city)
      )
    `);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count bookings per route
  const routeCounts: Record<string, number> = {};
  data?.forEach(b => {
    // b.flight should now be a single object, but handle array fallback for safety
    const flight = Array.isArray(b.flight) ? b.flight[0] : b.flight;
    if (!flight) return;
    const origin = Array.isArray(flight.origin) ? flight.origin[0] : flight.origin;
    const destination = Array.isArray(flight.destination) ? flight.destination[0] : flight.destination;
    if (!origin || !destination) return;
    const route = `${origin.city} (${origin.code}) → ${destination.city} (${destination.code})`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });

  // Sort and get top 5
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  return NextResponse.json({ topRoutes });
}