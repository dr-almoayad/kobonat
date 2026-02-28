// app/admin/_lib/queries.js

import { prisma } from '@/lib/prisma';

// ============================================================================
// STORES
// ============================================================================

export async function getStores(locale = 'en') {
  return prisma.store.findMany({
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
      _count: {
        select: {
          vouchers: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getStore(id, locale = 'en') {
  return prisma.store.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
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
      vouchers: {
        include: {
          translations: {
            where: { locale }
          },
          countries: {
            include: {
              country: true
            }
          },
          _count: {
            select: { clicks: true }
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
          },
          translations: {
            where: { locale }
          }
        }
      },
      _count: {
        select: {
          vouchers: true
        }
      }
    }
  });
}

// ============================================================================
// VOUCHERS
// ============================================================================

export async function getVouchers(storeId = null, locale = 'en') {
  const where = storeId ? { storeId: parseInt(storeId) } : {};
  
  return prisma.voucher.findMany({
    where,
    include: {
      translations: {
        where: { locale }
      },
      store: {
        include: {
          translations: {
            where: { locale }
          }
        }
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
      _count: {
        select: { clicks: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function getVoucher(id, locale = 'en') {
  return prisma.voucher.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      store: {
        include: {
          translations: {
            where: { locale }
          }
        }
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
      _count: {
        select: { clicks: true }
      }
    }
  });
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(locale = 'en') {
  return prisma.category.findMany({
    include: {
      translations: {
        where: { locale }
      },
      _count: {
        select: { stores: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getCategory(id, locale = 'en') {
  return prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      stores: {
        include: {
          store: {
            include: {
              translations: {
                where: { locale }
              }
            }
          }
        },
        take: 10
      },
      _count: {
        select: { stores: true }
      }
    }
  });
}

// ============================================================================
// COUNTRIES
// ============================================================================

export async function getCountries(locale = 'en') {
  return prisma.country.findMany({
    include: {
      translations: {
        where: { locale }
      },
      _count: {
        select: {
          stores: true,
          vouchers: true
        }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { code: 'asc' }
    ]
  });
}

export async function getCountry(id, locale = 'en') {
  return prisma.country.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      _count: {
        select: {
          stores: true,
          vouchers: true
        }
      }
    }
  });
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export async function getPaymentMethods(locale = 'en') {
  return prisma.paymentMethod.findMany({
    include: {
      translations: {
        where: { locale }
      },
      _count: {
        select: { storeLinks: true }
      }
    },
    orderBy: [
      { type: 'asc' },
      { isBnpl: 'desc' }
    ]
  });
}

export async function getPaymentMethod(id, locale = 'en') {
  return prisma.paymentMethod.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      storeLinks: {
        include: {
          store: {
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
        }
      },
      _count: {
        select: { storeLinks: true }
      }
    }
  });
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStores,
    activeStores,
    totalVouchers,
    activeVouchers,
    totalClicks,
    recentClicks,
    totalCountries,
    totalCategories
  ] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { isActive: true } }),
    prisma.voucher.count(),
    prisma.voucher.count({
      where: {
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } }
        ]
      }
    }),
    prisma.voucherClick.count(),
    prisma.voucherClick.count({
      where: {
        clickedAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.country.count({ where: { isActive: true } }),
    prisma.category.count()
  ]);

  return {
    stores: {
      total: totalStores,
      active: activeStores,
      inactive: totalStores - activeStores
    },
    vouchers: {
      total: totalVouchers,
      active: activeVouchers,
      expired: totalVouchers - activeVouchers
    },
    clicks: {
      total: totalClicks,
      last30Days: recentClicks
    },
    countries: totalCountries,
    categories: totalCategories
  };
}

// ============================================================================
// REFERENCE DATA (for dropdowns)
// ============================================================================

export async function getAllCountries(locale = 'en') {
  return prisma.country.findMany({
    where: { isActive: true },
    include: {
      translations: {
        where: { locale }
      },
      _count: {
        select: {
          stores: true,
          vouchers: true
        }
      }
    },
    orderBy: { code: 'asc' }
  });
}

export async function getAllCategories(locale = 'en') {
  return prisma.category.findMany({
    include: {
      translations: {
        where: { locale }
      },
      _count: {
        select: { stores: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAllStores(locale = 'en') {
  return prisma.store.findMany({
    where: { isActive: true },
    include: {
      translations: {
        where: { locale }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getStoreProducts(storeId, locale = 'en') {
  return prisma.storeProduct.findMany({
    where: { storeId: parseInt(storeId) },
    include: {
      translations: true,
      _count: {
        select: { clicks: true }
      }
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}

// ============================================================================
// BLOG — POSTS, AUTHORS, CATEGORIES, TAGS
// ============================================================================

export async function getBlogPosts(locale = 'en', { status, limit } = {}) {
  try {
    if (!prisma.blogPost) return [];
    return await prisma.blogPost.findMany({
      where: status ? { status } : undefined,
      include: {
        translations: { where: { locale } },
        author: true,
        category: { include: { translations: { where: { locale } } } },
        tags: { include: { tag: { include: { translations: { where: { locale } } } } } },
        primaryStore: {
          include: { translations: { where: { locale }, select: { name: true, slug: true } } },
        },
        _count: { select: { sections: true, linkedStores: true, relatedProducts: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  } catch (e) {
    console.error('[getBlogPosts]', e.message);
    return [];
  }
}

export async function getBlogPost(id, locale = 'en') {
  try {
    if (!prisma.blogPost) return null;
    return await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        author: true,
        category: { include: { translations: { where: { locale } } } },
        primaryStore: {
          include: { translations: { where: { locale }, select: { name: true, slug: true } } },
        },
        tags: { include: { tag: { include: { translations: true } } } },

        // ── Sections ────────────────────────────────────────────────────
        sections: {
          orderBy: { order: 'asc' },
          include: {
            translations: true,
            products: {
              orderBy: { order: 'asc' },
              include: { product: { include: { translations: { where: { locale } } } } },
            },
            stores: {
              orderBy: { order: 'asc' },
              include: { store: { include: { translations: { where: { locale }, select: { name: true, slug: true } } } } },
            },
          },
        },

        // ── Post-level linked stores ─────────────────────────────────────
        linkedStores: {
          orderBy: { order: 'asc' },
          include: {
            store: {
              include: {
                translations: { where: { locale }, select: { name: true, slug: true } },
                _count: { select: { vouchers: { where: { expiryDate: { gte: new Date() } } } } },
              },
            },
          },
        },

        // ── Post-level product links ─────────────────────────────────────
        relatedProducts: {
          include: { product: { include: { translations: { where: { locale } } } } },
        },

        // ── Editorial related posts ─────────────────────────────────────
        relatedPosts: {
          orderBy: { order: 'asc' },
          include: {
            relatedPost: {
              include: { translations: { where: { locale }, select: { title: true } } },
            },
          },
        },
      },
    });
  } catch (e) {
    console.error('[getBlogPost]', e.message);
    return null;
  }
}

export async function getStoreRelatedPosts(storeId, locale = 'en', limit = 4) {
  try {
    if (!prisma.blogPost) return [];
    return await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        OR: [
          { primaryStoreId: parseInt(storeId) },
          { linkedStores: { some: { storeId: parseInt(storeId) } } },
        ],
      },
      include: {
        translations: { where: { locale }, select: { title: true, excerpt: true } },
        category: { include: { translations: { where: { locale }, select: { name: true } } } },
      },
      orderBy: [{ primaryStoreId: 'asc' }, { publishedAt: 'desc' }],
      take: limit,
    });
  } catch (e) {
    console.error('[getStoreRelatedPosts]', e.message);
    return [];
  }
}

export async function getBlogAuthors() {
  try {
    if (!prisma.blogAuthor) return [];
    return await prisma.blogAuthor.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error('[getBlogAuthors]', e.message);
    return [];
  }
}

export async function getBlogAuthor(id) {
  try {
    if (!prisma.blogAuthor) return null;
    return await prisma.blogAuthor.findUnique({ where: { id: parseInt(id) } });
  } catch (e) {
    console.error('[getBlogAuthor]', e.message);
    return null;
  }
}

export async function getBlogCategories(locale = 'en') {
  try {
    if (!prisma.blogCategory) return [];
    return await prisma.blogCategory.findMany({
      include: {
        translations: { where: { locale } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error('[getBlogCategories]', e.message);
    return [];
  }
}

export async function getBlogCategory(id) {
  try {
    if (!prisma.blogCategory) return null;
    return await prisma.blogCategory.findUnique({
      where: { id: parseInt(id) },
      include: { translations: true },
    });
  } catch (e) {
    console.error('[getBlogCategory]', e.message);
    return null;
  }
}

export async function getBlogTags(locale = 'en') {
  try {
    if (!prisma.blogTag) return [];
    return await prisma.blogTag.findMany({
      include: {
        translations: { where: { locale } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error('[getBlogTags]', e.message);
    return [];
  }
}

// ============================================================================
// CURATED OFFERS
// ============================================================================

export async function getCuratedOffers(locale = 'en') {
  return prisma.curatedOffer.findMany({
    include: {
      translations: { where: { locale } },
      store:        { include: { translations: { where: { locale } } } },
      countries:    { include: { country: { include: { translations: { where: { locale } } } } } },
      _count:       { select: { countries: true } }
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }]
  });
}

// ============================================================================
// SAVINGS METHODOLOGY
// ============================================================================

/** All formula versions, newest first, with snapshot count. */
export async function getMethodologies() {
  return prisma.savingsMethodology.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { snapshots: true } } }
  });
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Paginated weekly leaderboard snapshots.
 * @param {string}  week       ISO week string e.g. "2026-W10"
 * @param {number|null} categoryId  null = global leaderboard
 */
export async function getLeaderboardSnapshots({
  week,
  categoryId = null,
  page       = 1,
  limit      = 50,
  search     = '',
} = {}) {
  const where = {
    weekIdentifier: week,
    categoryId:     categoryId ?? null,
    ...(search ? {
      store: {
        translations: {
          some: { locale: 'en', name: { contains: search, mode: 'insensitive' } }
        }
      }
    } : {})
  };

  const [total, snapshots, availableWeeksRaw] = await Promise.all([
    prisma.storeSavingsSnapshot.count({ where }),
    prisma.storeSavingsSnapshot.findMany({
      where,
      orderBy: { rank: 'asc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, rank: true, previousRank: true, movement: true,
        calculatedMaxSavingsPercent: true, savingsOverridePercent: true,
        maxDirectDiscountPercent: true, maxCouponPercent: true, maxBankOfferPercent: true,
        weekIdentifier: true, calculatedAt: true,
        store: {
          select: {
            id: true, logo: true,
            translations: { where: { locale: 'en' }, select: { name: true, slug: true } }
          }
        },
        methodology: { select: { version: true } }
      }
    }),
    // Last 12 available weeks for the week-selector dropdown
    prisma.storeSavingsSnapshot.findMany({
      where:    { categoryId: categoryId ?? null },
      distinct: ['weekIdentifier'],
      orderBy:  { weekIdentifier: 'desc' },
      take:     12,
      select:   { weekIdentifier: true }
    })
  ]);

  return {
    snapshots,
    total,
    pages:          Math.ceil(total / limit),
    availableWeeks: availableWeeksRaw.map(w => w.weekIdentifier)
  };
}

// ============================================================================
// STORE INTELLIGENCE
// ============================================================================

/**
 * Full intelligence read for a single store.
 * Returns logistics + last 6 months of metrics + upcoming events + peak seasons + recent snapshots.
 */
export async function getStoreIntelligence(storeId) {
  return prisma.store.findUnique({
    where: { id: parseInt(storeId) },
    select: {
      id: true, logo: true,
      averageDeliveryDaysMin: true, averageDeliveryDaysMax: true,
      freeShippingThreshold: true, returnWindowDays: true, freeReturns: true,
      refundProcessingDaysMin: true, refundProcessingDaysMax: true,
      offerFrequencyDays: true, lastVerifiedAt: true,
      translations: { where: { locale: 'en' }, select: { name: true, slug: true } },
      savingsMetrics: {
        orderBy: { monthIdentifier: 'desc' },
        take:    6,
        select: {
          monthIdentifier: true, averageDiscountPercent: true, maxStackableSavingsPercent: true,
          totalActiveOffers: true, storeScore: true,
          scoreBreakdown: true, updatedAt: true
        }
      },
      savingsSnapshots: {
        where:   { categoryId: null },
        orderBy: { weekIdentifier: 'desc' },
        take:    4,
        select: {
          weekIdentifier: true, rank: true, previousRank: true, movement: true,
          calculatedMaxSavingsPercent: true, savingsOverridePercent: true
        }
      },
      upcomingEvents: {
        orderBy: { expectedMonth: 'asc' },
        select:  { id: true, eventName: true, expectedMonth: true, confidenceLevel: true, expectedMaxDiscount: true, notes: true }
      },
      peakSeasons: {
        orderBy: { seasonKey: 'asc' },
        select:  { id: true, seasonKey: true, nameEn: true, nameAr: true }
      }
    }
  });
}

/**
 * Vouchers for a store with all calculator fields — for the offers editor page.
 */
export async function getStoreVouchersForCalc(storeId, {
  certainty   = null,
  stackGroup  = null,
  showExpired = false,
  search      = '',
  page        = 1,
  limit       = 50,
} = {}) {
  const now   = new Date();
  const where = {
    storeId: parseInt(storeId),
    ...(certainty  && { discountCertainty: certainty }),
    ...(stackGroup && { stackGroup }),
    ...(!showExpired && { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] }),
    ...(search && {
      translations: { some: { locale: 'en', title: { contains: search, mode: 'insensitive' } } }
    })
  };

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      orderBy: [{ discountCertainty: 'asc' }, { updatedAt: 'desc' }],
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, code: true, type: true, discount: true,
        discountPercent: true, verifiedAvgPercent: true, discountCertainty: true,
        stackGroup: true, isStackable: true, isCapped: true,
        maxDiscountAmount: true, minSpendAmount: true,
        isVerified: true, isExclusive: true, expiryDate: true,
        translations: { where: { locale: 'en' }, select: { title: true } }
      }
    })
  ]);

  return { vouchers, total, pages: Math.ceil(total / limit) };
}

/**
 * OtherPromos for a store with calculator fields — for the offers editor page.
 */
export async function getStorePromosForCalc(storeId) {
  return prisma.otherPromo.findMany({
    where:   { storeId: parseInt(storeId) },
    orderBy: [{ discountCertainty: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true, type: true,
      discountPercent: true, verifiedAvgPercent: true, discountCertainty: true,
      stackGroup: true, isStackable: true, isCapped: true,
      maxDiscountAmount: true, minSpendAmount: true,
      translations: { where: { locale: 'en' }, select: { title: true } }
    }
  });
}
