import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    const products = await prisma.storeProduct.findMany({
      where: { storeId: parseInt(id) },
      include: {
        translations: true,
        _count: {
          select: { clicks: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
