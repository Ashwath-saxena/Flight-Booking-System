// frontend/src/app/api/airports/cities/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseServerClient';

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('airports')
    .select('city')
    .order('city', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Remove duplicates and nulls
  const cities = Array.from(
    new Set((data ?? []).map((row) => row.city).filter((c): c is string => !!c))
  );

  return NextResponse.json({ cities });
}