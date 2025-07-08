// frontend/src/app/api/dashboard/summary/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  // Total bookings
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  // Total revenue (all time)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_amount');

  const totalRevenue = bookings ? bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) : 0;

  // Active flights today
  const today = new Date().toISOString().slice(0, 10);
  const { count: activeFlights } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true })
    .gte('departure_time', `${today}T00:00:00`)
    .lt('departure_time', `${today}T23:59:59`);

  // Total users (profiles table)
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Total distinct flights
  const { count: flightsCount } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    totalBookings: bookingsCount || 0,
    totalRevenue,
    activeFlights: activeFlights || 0,
    totalUsers: userCount || 0,
    totalFlights: flightsCount || 0,
  });
}