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
      // This is the missing piece for the counts
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
      translations: true, // Fetch all translations for the admin edit form
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
// BLOG — append these to your existing app/admin/_lib/queries.js
// ============================================================================

export async function getBlogPosts(locale = 'en') {
  return prisma.blogPost.findMany({
    include: {
      translations: { where: { locale } },
      author: true,
      category: {
        include: { translations: { where: { locale } } }
      },
      tags: {
        include: { tag: { include: { translations: { where: { locale } } } } }
      },
      _count: { select: { relatedProducts: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBlogPost(id, locale = 'en') {
  return prisma.blogPost.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,           // all locales for the edit form
      author: true,
      category: {
        include: { translations: { where: { locale } } }
      },
      tags: {
        include: { tag: { include: { translations: true } } }
      },
      relatedProducts: true,
      relatedPosts: {
        include: {
          relatedPost: {
            include: { translations: { where: { locale } } }
          }
        }
      }
    }
  });
}

export async function getBlogCategories(locale = 'en') {
  return prisma.blogCategory.findMany({
    include: {
      translations: { where: { locale } },
      _count: { select: { posts: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBlogCategory(id) {
  return prisma.blogCategory.findUnique({
    where: { id: parseInt(id) },
    include: { translations: true }
  });
}

export async function getBlogAuthors() {
  return prisma.blogAuthor.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBlogAuthor(id) {
  return prisma.blogAuthor.findUnique({
    where: { id: parseInt(id) }
  });
}

export async function getBlogTags(locale = 'en') {
  return prisma.blogTag.findMany({
    include: {
      translations: { where: { locale } },
      _count: { select: { posts: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBlogDashboardStats() {
  const now = new Date();
  const [total, published, draft, totalCategories, totalAuthors] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', publishedAt: { lte: now } } }),
    prisma.blogPost.count({ where: { status: 'DRAFT' } }),
    prisma.blogCategory.count(),
    prisma.blogAuthor.count()
  ]);
  return { total, published, draft, categories: totalCategories, authors: totalAuthors };
}
