// app/api/admin/leaderboard/trigger/route.js
// POST — manually triggers the leaderboard cron job for a specific store or all stores
//
// Body (all optional):
//   { storeId: 42 }     — run for a single store only
//   {}                  — run for all active stores (may take 30–60s for large catalogues)

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runLeaderboardCron } from '@/lib/leaderboard/runLeaderboardCron';

export async function POST(request) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.ok) return auth.response;

  const body    = await request.json().catch(() => ({}));
  const storeId = body.storeId ? Number(body.storeId) : null;

  const start = Date.now();
  try {
    const result = await runLeaderboardCron({ storeId });
    return NextResponse.json({ ok: true, ...result, durationMs: Date.now() - start });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message, durationMs: Date.now() - start }, { status: 500 });
  }
}
