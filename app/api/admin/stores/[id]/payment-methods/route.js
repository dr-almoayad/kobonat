// app/api/admin/stores/[id]/payment-methods/route.js 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Verify path
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: storeId } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const storePaymentMethods = await prisma.storePaymentMethod.findMany({
      where: { storeId: parseInt(storeId) },
      include: {
        paymentMethod: {
          include: {
            translations: { where: { locale } }
          }
        },
        country: {
          include: {
            translations: { where: { locale } }
          }
        },
        translations: true // Include translations to show notes in UI
      }
    });

    return NextResponse.json({ storePaymentMethods });
  } catch (error) {
    console.error('Error fetching store payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: storeId } = await params;
    const body = await req.json();
    
    // notes_en comes from the frontend form
    const { countryId, paymentMethodId, isActive, notes_en, notes_ar } = body;

    // 1. Upsert the Link (StorePaymentMethod)
    const spm = await prisma.storePaymentMethod.upsert({
      where: {
        storeId_countryId_paymentMethodId: {
          storeId: parseInt(storeId),
          countryId: parseInt(countryId),
          paymentMethodId: parseInt(paymentMethodId)
        }
      },
      update: { isActive },
      create: {
        storeId: parseInt(storeId),
        countryId: parseInt(countryId),
        paymentMethodId: parseInt(paymentMethodId),
        isActive
      }
    });

    // 2. Upsert Translations (StorePaymentMethodTranslation)
    // English Note
    if (notes_en) {
      await prisma.storePaymentMethodTranslation.upsert({
        where: {
          storePaymentMethodId_locale: {
            storePaymentMethodId: spm.id,
            locale: 'en'
          }
        },
        create: {
          storePaymentMethodId: spm.id,
          locale: 'en',
          notes: notes_en
        },
        update: { notes: notes_en }
      });
    }

    // Arabic Note (Optional)
    if (notes_ar) {
      await prisma.storePaymentMethodTranslation.upsert({
        where: {
          storePaymentMethodId_locale: {
            storePaymentMethodId: spm.id,
            locale: 'ar'
          }
        },
        create: {
          storePaymentMethodId: spm.id,
          locale: 'ar',
          notes: notes_ar
        },
        update: { notes: notes_ar }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add DELETE to allow removing links
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: storeId } = await params;
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get('countryId');
    const paymentMethodId = searchParams.get('paymentMethodId');

    await prisma.storePaymentMethod.delete({
      where: {
        storeId_countryId_paymentMethodId: {
          storeId: parseInt(storeId),
          countryId: parseInt(countryId),
          paymentMethodId: parseInt(paymentMethodId)
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}