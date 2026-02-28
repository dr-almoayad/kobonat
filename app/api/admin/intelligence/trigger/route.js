// app/api/admin/intelligence/trigger/route.js
// POST — manually triggers the intelligence cron for one or all stores

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { runIntelligenceCron } from '@/lib/intelligence/runIntelligenceCron';

export async function POST(request) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body    = await request.json().catch(() => ({}));
  const storeId = body.storeId ? Number(body.storeId) : null;

  const start = Date.now();
  try {
    const result = await runIntelligenceCron({ storeId });
    return NextResponse.json({ ok: true, ...result, durationMs: Date.now() - start });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message, durationMs: Date.now() - start }, { status: 500 });
  }
}
