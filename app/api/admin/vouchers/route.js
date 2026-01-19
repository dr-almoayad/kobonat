// app/api/admin/vouchers/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getVouchers } from '@/app/admin/_lib/queries';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const vouchers = await getVouchers(null, locale);

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Admin vouchers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}