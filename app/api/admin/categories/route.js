// app/api/admin/categories/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getAllCategories } from '@/app/admin/_lib/queries';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const categories = await getAllCategories(locale);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Admin categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}