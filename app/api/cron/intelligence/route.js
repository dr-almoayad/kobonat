// app/api/cron/intelligence/route.js
// Triggered by Vercel Cron on the 1st of every month at 02:00 UTC.
// Add to vercel.json:
// { "path": "/api/cron/intelligence", "schedule": "0 2 1 * *" }

import { NextResponse } from 'next/server';
import { runIntelligenceCron } from '@/lib/intelligence/runIntelligenceCron.js';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  try {
    const result = await runIntelligenceCron();
    return NextResponse.json({ ok: true, ...result, durationMs: Date.now() - start });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message, durationMs: Date.now() - start }, { status: 500 });
  }
}
