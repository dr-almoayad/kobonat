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

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const store = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        // Basic translations
        translations: {
          where: { locale: { in: ['en', 'ar'] } }
        },

        // Countries
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

        // Categories
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

        // Payment methods
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
            // StorePaymentMethodTranslation intentionally omitted (notes field only)
          }
        },

        // Vouchers
        vouchers: {
          include: {
            translations: {
              where: { locale }
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
            }
          },
          orderBy: { createdAt: 'desc' }
        },

        // FAQs
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
        },

        // Other promos (bank/card offers)
        otherPromos: {
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
        },

        // Curated offers
        curatedOffers: {
          include: {
            translations: {
              where: { locale }
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
            }
          },
          orderBy: { order: 'asc' }
        },

        // Store products
        products: {
          include: {
            translations: {
              where: { locale }
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
            }
          },
          orderBy: { order: 'asc' }
        },

        // Leaderboard snapshots (latest 10 weeks)
        savingsSnapshots: {
          orderBy: { weekIdentifier: 'desc' },
          take: 10
        },

        // Store intelligence metrics (latest 12 months)
        savingsMetrics: {
          orderBy: { monthIdentifier: 'desc' },
          take: 12
        },

        // Upcoming events
        upcomingEvents: {
          orderBy: { expectedMonth: 'asc' }
        },

        // Peak seasons
        peakSeasons: true,

        // Blog relations (optional – can be excluded if too heavy)
        primaryBlogPosts: {
          where: { status: 'PUBLISHED' },
          include: {
            translations: {
              where: { locale }
            }
          },
          take: 5,
          orderBy: { publishedAt: 'desc' }
        },
        blogPostStores: {
          include: {
            post: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          },
          take: 5,
          orderBy: { post: { publishedAt: 'desc' } }
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

// PUT and DELETE remain as previously updated (await params, etc.)
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();
    const {
      logo,
      bigLogo,
      color,
      showOffer,
      showOfferType,
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
        bigLogo,
        color,
        showOffer,
        showOfferType,
        websiteUrl,
        affiliateNetwork,
        trackingUrl,
        isActive,
        isFeatured
      }
    });

    // Update translations if provided
    if (translations) {
      await prisma.storeTranslation.deleteMany({
        where: { storeId: parseInt(id) }
      });
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

    const { id } = await params; 
    const storeId = parseInt(id);
    
    // Check if store exists and count dependencies
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            vouchers: true,
            products: true,
            faqs: true,
            otherPromos: true,
            curatedOffers: true,
            upcomingEvents: true,
            peakSeasons: true,
            primaryBlogPosts: true,
            blogPostStores: true,
            savingsSnapshots: true,
            savingsMetrics: true
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
    
    // Check if store has any dependencies (excluding read-only analytics)
    const dependentCounts = store._count;
    const deletableDeps = [
      'vouchers',
      'products',
      'faqs',
      'otherPromos',
      'curatedOffers',
      'upcomingEvents',
      'peakSeasons',
      'primaryBlogPosts',
      'blogPostStores'
    ];
    
    const hasDependencies = deletableDeps.some(key => dependentCounts[key] > 0);
    
    if (hasDependencies) {
      return NextResponse.json(
        { 
          error: `Cannot delete store. It has related records.`,
          details: dependentCounts
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
