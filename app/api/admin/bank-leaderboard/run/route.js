// app/api/admin/bank-leaderboard/run/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { calculateBankNicheScores } from '@/lib/banks/calculateBankNicheScores';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body   = await req.json().catch(() => ({}));
    const result = await calculateBankNicheScores(body.week || undefined);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[bank-leaderboard/run]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
