import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 15 Fix: params is a Promise
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const store = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: {
          where: { locale: { in: ['en', 'ar'] } }
        },
        countries: {
          include: {
            country: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          }
        },
        categories: {
          include: {
            category: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          }
        },
        paymentMethods: {
          include: {
            paymentMethod: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            },
            country: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
            // REMOVED: translations include here because StorePaymentMethod 
            // only has a "notes" field, not a translation relation.
          }
        },
        vouchers: {
          include: {
            translations: {
              where: { locale }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        faqs: {
          include: {
            translations: {
              where: { locale }
            },
            country: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('Admin store GET error:', error);
    return NextResponse.json({ error: "Failed to fetch store" }, { status: 500 });
  }
}

// PUT and DELETE should also await params for Next.js 15 consistency
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();
    const {
      logo,
      color,
      websiteUrl,
      affiliateNetwork,
      trackingUrl,
      isActive,
      isFeatured,
      translations,
      countryIds,
      categoryIds
    } = data;

    // Update store
    const store = await prisma.store.update({
      where: { id: parseInt(id) },
      data: {
        logo,
        color,
        websiteUrl,
        affiliateNetwork,
        trackingUrl,
        isActive,
        isFeatured
      }
    });

    // Update translations if provided
    if (translations) {
      // Delete existing translations
      await prisma.storeTranslation.deleteMany({
        where: { storeId: parseInt(id) }
      });
      // Create new translations
      await prisma.storeTranslation.createMany({
        data: translations.map(t => ({
          ...t,
          storeId: parseInt(id)
        }))
      });
    }

    // Update countries if provided
    if (countryIds) {
      await prisma.storeCountry.deleteMany({
        where: { storeId: parseInt(id) }
      });
      await prisma.storeCountry.createMany({
        data: countryIds.map(countryId => ({
          storeId: parseInt(id),
          countryId
        }))
      });
    }

    // Update categories if provided
    if (categoryIds) {
      await prisma.storeCategory.deleteMany({
        where: { storeId: parseInt(id) }
      });
      await prisma.storeCategory.createMany({
        data: categoryIds.map(categoryId => ({
          storeId: parseInt(id),
          categoryId
        }))
      });
    }

    // Fetch updated store
    const updated = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        countries: true,
        categories: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin store PUT error:', error);
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
  }
}



export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIX: Await params
    const { id } = await params; 
    const storeId = parseInt(id);
    
    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            vouchers: true,
            products: true,
            faqs: true,
            otherPromos: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }
    
    // Check if store has any dependencies
    const totalDependencies = 
      store._count.vouchers + 
      store._count.products + 
      store._count.faqs + 
      store._count.otherPromos;
    
    if (totalDependencies > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete store. It has ${store._count.vouchers} vouchers, ${store._count.products} products, ${store._count.faqs} FAQs, and ${store._count.otherPromos} promos. Please delete these first.`,
          details: {
            vouchers: store._count.vouchers,
            products: store._count.products,
            faqs: store._count.faqs,
            otherPromos: store._count.otherPromos
          }
        },
        { status: 400 }
      );
    }

    // Safe to delete - no dependencies
    await prisma.store.delete({
      where: { id: storeId }
    });

    return NextResponse.json({ 
      success: true,
      message: "Store deleted successfully"
    });
    
  } catch (error) {
    console.error('Admin store DELETE error:', error);
    return NextResponse.json({ 
      error: "Failed to delete store",
      details: error.message 
    }, { status: 500 });
  }
}
