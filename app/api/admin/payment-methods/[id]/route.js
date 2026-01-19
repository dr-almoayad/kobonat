// app/api/admin/payment-methods/[id]/route.js - Single Payment Method (Updated for translation schema)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

/**
 * GET - Get single payment method by ID
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        storeLinks: {
          include: {
            store: {
              include: {
                translations: {
                  where: { locale: 'en' }
                }
              }
            },
            country: {
              include: {
                translations: {
                  where: { locale: 'en' }
                }
              }
            },
            translations: {
              where: { locale }
            }
          },
          orderBy: [{ country: { code: 'asc' } }]
        }
      }
    });

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method not found' 
      }, { status: 404 });
    }

    // Transform response
    const transformedMethod = {
      ...paymentMethod,
      name: paymentMethod.translations.find(t => t.locale === locale)?.name || '',
      description: paymentMethod.translations.find(t => t.locale === locale)?.description || null,
      translations: paymentMethod.translations.reduce((acc, t) => {
        acc[t.locale] = {
          name: t.name,
          description: t.description
        };
        return acc;
      }, {})
    };

    return NextResponse.json({ paymentMethod: transformedMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payment method',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT - Update payment method
 */
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { 
      slug, 
      type, 
      isBnpl, 
      logo, 
      translations 
    } = body;

    // Check if payment method exists
    const existing = await prisma.paymentMethod.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return NextResponse.json({ 
        error: 'Payment method not found' 
      }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.paymentMethod.findUnique({
        where: { slug }
      });
      
      if (slugExists) {
        return NextResponse.json({ 
          error: 'Payment method with this slug already exists' 
        }, { status: 409 });
      }
    }

    // Update main record
    const updated = await prisma.paymentMethod.update({
      where: { id: parseInt(id) },
      data: {
        slug,
        type,
        isBnpl,
        logo
      }
    });

    // Update translations if provided
    if (translations) {
      for (const translation of translations) {
        await prisma.paymentMethodTranslation.upsert({
          where: {
            paymentMethodId_locale: {
              paymentMethodId: updated.id,
              locale: translation.locale
            }
          },
          create: {
            paymentMethodId: updated.id,
            locale: translation.locale,
            name: translation.name,
            description: translation.description
          },
          update: {
            name: translation.name,
            description: translation.description
          }
        });
      }
    }

    // Fetch updated payment method with translations
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: updated.id },
      include: {
        translations: true
      }
    });

    // Transform response
    const transformedMethod = {
      ...paymentMethod,
      name_en: paymentMethod.translations.find(t => t.locale === 'en')?.name || '',
      name_ar: paymentMethod.translations.find(t => t.locale === 'ar')?.name || '',
      description_en: paymentMethod.translations.find(t => t.locale === 'en')?.description || null,
      description_ar: paymentMethod.translations.find(t => t.locale === 'ar')?.description || null
    };

    return NextResponse.json({ 
      paymentMethod: transformedMethod 
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ 
      error: 'Failed to update payment method',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE - Delete payment method
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if payment method is used by any stores
    const storeLinksCount = await prisma.storePaymentMethod.count({
      where: { paymentMethodId: parseInt(id) }
    });

    if (storeLinksCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete payment method used by ${storeLinksCount} stores` 
      }, { status: 400 });
    }

    await prisma.paymentMethod.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Payment method deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ 
      error: 'Failed to delete payment method',
      details: error.message 
    }, { status: 500 });
  }
}