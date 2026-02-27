// app/api/cron/leaderboard/route.js
// Vercel Cron endpoint. Configure in vercel.json (see bottom of file).
// Protected by CRON_SECRET env variable — Vercel sets this automatically.

import { NextResponse } from 'next/server';
import { runLeaderboardCron } from '@/lib/leaderboard/runLeaderboardCron';

export async function GET(request) {
  // Verify this is called by Vercel Cron (not a random HTTP request)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const result = await runLeaderboardCron();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      errors:    result.errors,
      durationMs: Date.now() - start,
    });
  } catch (error) {
    console.error('[leaderboard cron]', error);
    return NextResponse.json(
      { ok: false, error: error.message, durationMs: Date.now() - start },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Add this to your vercel.json to run every Monday at 00:00 UTC:
//
// {
//   "crons": [
//     {
//       "path": "/api/cron/leaderboard",
//       "schedule": "0 0 * * 1"
//     }
//   ]
// }
//
// Vercel automatically injects CRON_SECRET as an Authorization header.
// On Hobby plan crons run daily max; on Pro they support any cron schedule.
// ─────────────────────────────────────────────────────────────────────────────
