// src/app/api/auth/signup/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = row not found, which is fine
      throw findError;
    }

    if (existingUser) {
       return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }]);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}