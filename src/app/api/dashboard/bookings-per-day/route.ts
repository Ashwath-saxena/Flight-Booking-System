// frontend/src/app/api/dashboard/bookings-per-day/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  // Bookings per day for the last 30 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  const from = startDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('bookings')
    .select('created_at')
    .gte('created_at', `${from}T00:00:00`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group bookings by day (YYYY-MM-DD)
  const counts: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    counts[d.toISOString().slice(0, 10)] = 0;
  }

  data?.forEach(b => {
    const date = b.created_at.slice(0, 10);
    if (counts[date] !== undefined) counts[date] += 1;
  });

  return NextResponse.json({
    bookingsPerDay: Object.entries(counts).map(([date, count]) => ({ date, count }))
  });
}