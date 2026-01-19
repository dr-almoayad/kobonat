// app/api/admin/countries/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const country = await prisma.country.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        _count: {
          select: {
            stores: {
              where: {
                store: { isActive: true }
              }
            },
            vouchers: {
              where: {
                voucher: {
                  expiryDate: { gte: new Date() }
                }
              }
            }
          }
        }
      }
    });

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      country: {
        id: country.id,
        code: country.code,
        name: country.translations.find(t => t.locale === 'en')?.name || '',
        name_ar: country.translations.find(t => t.locale === 'ar')?.name || '',
        currency: country.currency,
        flag: country.flag,
        isActive: country.isActive,
        isDefault: country.isDefault,
        _count: country._count
      }
    });
  } catch (error) {
    console.error('Admin country API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    
    const country = await prisma.country.update({
      where: { id: parseInt(id) },
      data: {
        code: body.code,
        currency: body.currency,
        flag: body.flag,
        isActive: body.isActive,
        isDefault: body.isDefault
      }
    });

    return NextResponse.json({ success: true, country });
  } catch (error) {
    console.error('Update country error:', error);
    return NextResponse.json(
      { error: 'Failed to update country' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Check if country has stores
    const storeCount = await prisma.storeCountry.count({
      where: { countryId: parseInt(id) }
    });

    if (storeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete country used by ${storeCount} stores` },
        { status: 400 }
      );
    }

    await prisma.country.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete country error:', error);
    return NextResponse.json(
      { error: 'Failed to delete country' },
      { status: 500 }
    );
  }
}