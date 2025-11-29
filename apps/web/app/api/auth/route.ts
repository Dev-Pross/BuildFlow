import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@repo/db/client';
import bcrypt from 'bcryptjs';

// POST /api/auth
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prismaClient.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 } );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prismaClient.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}