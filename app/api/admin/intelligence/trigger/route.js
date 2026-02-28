// app/api/admin/intelligence/trigger/route.js
// POST — manually triggers the intelligence cron for one or all stores

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runIntelligenceCron } from '@/lib/intelligence/runIntelligenceCron';

export async function POST(request) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.ok) return auth.response;

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
