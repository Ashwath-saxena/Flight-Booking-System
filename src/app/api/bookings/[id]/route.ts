// frontend/src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { passengers } = await req.json();
  const { id } = await params;
  const { error } = await supabase
    .from('bookings')
    .update({ passengers })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Booking updated.' });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Set status to cancelled
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Booking cancelled.' });
}