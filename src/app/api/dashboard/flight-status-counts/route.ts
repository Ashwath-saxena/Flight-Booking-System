// frontend/src/app/api/dashboard/flight-status-counts/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  // Get latest status for each flight from flight_status_updates
  const { data, error } = await supabase
    .from('flight_status_updates')
    .select('flight_id, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to get the latest status per flight
  const latestStatus: Record<string, string> = {};
  data?.forEach(s => {
    if (!latestStatus[s.flight_id]) latestStatus[s.flight_id] = s.status;
  });

  // Count by status
  const statusCounts: Record<string, number> = {};
  Object.values(latestStatus).forEach(status => {
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return NextResponse.json({ statusCounts });
}