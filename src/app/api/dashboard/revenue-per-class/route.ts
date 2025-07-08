// frontend/src/app/api/dashboard/revenue-per-class/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  // Get all bookings and their passengers
  const { data, error } = await supabase
    .from('bookings')
    .select('total_amount, passengers(cabin_class)')
    .not('booking_status', 'eq', 'Cancelled');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate revenue by cabin class
  const revenueByClass: Record<string, number> = {};

  data?.forEach(b => {
    // Divide booking total among passengers, then sum for each class
    const pCount = b.passengers?.length || 1;
    b.passengers?.forEach(p => {
      revenueByClass[p.cabin_class] = (revenueByClass[p.cabin_class] || 0) + (b.total_amount || 0) / pCount;
    });
  });

  return NextResponse.json({ revenueByClass });
}