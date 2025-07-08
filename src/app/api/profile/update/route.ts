// frontend/src/app/api/profile/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, first_name, last_name, phone_number, date_of_birth, address } = body;
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, first_name, last_name, phone_number, date_of_birth, address });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Profile updated' });
}