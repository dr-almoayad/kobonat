// lib/services/collectionService.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class CollectionService {
  // Create a new collection
  async createCollection(userId, data) {
    const { 
      title, 
      description = '', 
      type = 'general', 
      visibility = 'public', 
      layout = 'grid',
      coverImage = null
    } = data
    
    console.log('Creating collection with data:', { userId, title, description, type, visibility, layout, coverImage });

    // Validate required fields
    if (!title || !title.trim()) {
      throw new Error('Collection title is required');
    }
    
    // Generate unique slug
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    // Check for existing slug
    while (await prisma.collection.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    try {
      // First, create the collection without the complex include
      const collection = await prisma.collection.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          slug,
          type,
          visibility,
          layout,
          coverImage,
          userId,
          totalPrice: 0,
          priceAlertEnabled: false,
          isTemplate: false,
          theme: 'default'
        }
      })

      console.log('Collection created successfully, now fetching with relations...');

      // Then fetch it with the relations
      const collectionWithRelations = await prisma.collection.findUnique({
        where: { id: collection.id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  stores: {
                    orderBy: { price: 'asc' },
                    take: 1,
                    include: { store: true }
                  }
                }
              }
            }
          }
        }
      })
      
      console.log('Collection with relations:', collectionWithRelations);
      return collectionWithRelations;
      
    } catch (error) {
      console.error('Prisma create error:', error);
      console.error('Error details:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        throw new Error('A collection with this name already exists');
      }
      
      throw new Error(`Database error: ${error.message}`);
    }
  }
  
  // ... rest of your existing methods remain the same
  async addProductToCollection(collectionId, productId, userId, metadata = {}) {
    // Verify user owns or can edit this collection
    const collection = await this.getCollectionWithPermissions(collectionId, userId)
    
    if (!collection.canEdit) {
      throw new Error('Permission denied')
    }
    
    // Get current max position
    const maxPosition = await prisma.collectionItem.aggregate({
      where: { collectionId },
      _max: { position: true }
    })
    
    // Get product to capture current price
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stores: {
          orderBy: { price: 'asc' },
          take: 1
        }
      }
    })
    
    const collectionItem = await prisma.collectionItem.create({
      data: {
        collectionId,
        productId,
        position: (maxPosition._max.position || 0) + 1,
        priceAtAdd: product?.stores[0]?.price,
        notes: metadata.notes,
        category: metadata.category,
        quantity: metadata.quantity || 1
      },
      include: {
        product: {
          include: {
            images: true,
            brand: true,
            stores: {
              orderBy: { price: 'asc' },
              take: 3,
              include: { store: true }
            }
          }
        }
      }
    })
    
    // Update collection total price
    await this.updateCollectionTotalPrice(collectionId)
    
    return collectionItem
  }
  
  async removeProductFromCollection(collectionId, productId, userId) {
    const collection = await this.getCollectionWithPermissions(collectionId, userId)
    
    if (!collection.canEdit) {
      throw new Error('Permission denied')
    }
    
    await prisma.collectionItem.delete({
      where: {
        collectionId_productId: {
          collectionId,
          productId
        }
      }
    })
    
    // Update collection total price
    await this.updateCollectionTotalPrice(collectionId)
    
    return { success: true }
  }
  
  async getCollectionBySlug(slug, userId = null) {
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            product: {
              include: {
                images: true,
                brand: true,
                category: true,
                stores: {
                  orderBy: { price: 'asc' },
                  include: { store: true }
                }
              }
            }
          }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })
    
    if (!collection) {
      throw new Error('Collection not found')
    }
    
    // Check permissions
    const isOwner = userId && collection.userId === userId
    const isCollaborator = userId && collection.collaborators.some(c => c.userId === userId)
    const canView = collection.visibility === 'public' || isOwner || isCollaborator
    const canEdit = isOwner || (isCollaborator && collection.collaborators.find(c => c.userId === userId)?.role === 'editor')
    
    if (!canView) {
      throw new Error('Collection is private')
    }
    
    // Increment view count (async, don't await)
    prisma.collection.update({
      where: { id: collection.id },
      data: { viewCount: { increment: 1 } }
    }).catch(console.error)
    
    return {
      ...collection,
      permissions: { canView, canEdit, isOwner }
    }
  }
  
  async getUserCollections(userId, options = {}) {
    const { includeCollaborated = false, type, visibility } = options
    
    const where = includeCollaborated
      ? {
          OR: [
            { userId },
            { collaborators: { some: { userId } } }
          ]
        }
      : { userId }
    
    if (type) where.type = type
    if (visibility) where.visibility = visibility
    
    return await prisma.collection.findMany({
      where,
      include: {
        items: {
          take: 4,
          include: {
            product: {
              include: { images: true }
            }
          }
        },
        _count: {
          select: { items: true, likes: true, comments: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }
  
  async updateCollectionTotalPrice(collectionId) {
    const items = await prisma.collectionItem.findMany({
      where: { collectionId },
      include: {
        product: {
          include: {
            stores: {
              orderBy: { price: 'asc' },
              take: 1
            }
          }
        }
      }
    })
    
    const totalPrice = items.reduce((sum, item) => {
      const price = item.product.stores[0]?.price || 0
      return sum + (price * item.quantity)
    }, 0)
    
    await prisma.collection.update({
      where: { id: collectionId },
      data: { totalPrice }
    })
    
    return totalPrice
  }
  
  async toggleLike(collectionId, userId) {
    const existingLike = await prisma.collectionLike.findUnique({
      where: {
        collectionId_userId: { collectionId, userId }
      }
    })
    
    if (existingLike) {
      await prisma.collectionLike.delete({
        where: { id: existingLike.id }
      })
      
      await prisma.collection.update({
        where: { id: collectionId },
        data: { likeCount: { decrement: 1 } }
      })
      
      return { liked: false }
    } else {
      await prisma.collectionLike.create({
        data: { collectionId, userId }
      })
      
      await prisma.collection.update({
        where: { id: collectionId },
        data: { likeCount: { increment: 1 } }
      })
      
      return { liked: true }
    }
  }
  
  async addComment(collectionId, userId, content, parentId = null) {
    return await prisma.collectionComment.create({
      data: {
        collectionId,
        userId,
        content,
        parentId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  }
  
  async getTrendingCollections(limit = 10, type = null) {
    const where = { visibility: 'public' };
    if (type) where.type = type;

    return await prisma.collection.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true }
        },
        items: {
          take: 4,
          include: {
            product: {
              include: {
                images: true,
                stores: {
                  orderBy: { price: 'asc' },
                  take: 1,
                  include: { store: true }
                }
              }
            }
          }
        },
        _count: {
          select: { items: true, likes: true, comments: true }
        }
      },
      orderBy: [
        { likeCount: 'desc' },
        { viewCount: 'desc' }
      ],
      take: limit
    });
  }

  
  async trackShare(collectionId, platform, userId = null) {
    await prisma.collectionShare.create({
      data: { collectionId, platform, userId }
    })
    
    await prisma.collection.update({
      where: { id: collectionId },
      data: { shareCount: { increment: 1 } }
    })
  }
  
  async getCollectionWithPermissions(collectionId, userId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        collaborators: {
          where: { userId }
        }
      }
    })
    
    if (!collection) {
      throw new Error('Collection not found')
    }
    
    const isOwner = collection.userId === userId
    const collaborator = collection.collaborators[0]
    const canEdit = isOwner || (collaborator && collaborator.role === 'editor')
    
    return { ...collection, canEdit, isOwner }
  }
  
  async suggestCompatibleProducts(collectionId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                productAttributes: true
              }
            }
          }
        }
      }
    })
    
    if (collection.type !== 'tech-build') {
      return []
    }
    
    // Simple compatibility logic - can be enhanced
    const existingCategories = new Set(
      collection.items.map(item => item.category || item.product.category?.name)
    )
    
    const suggestions = []
    const buildCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case']
    
    for (const category of buildCategories) {
      if (!existingCategories.has(category)) {
        // Find popular products in this category
        const products = await prisma.product.findMany({
          where: {
            category: {
              name: { contains: category, mode: 'insensitive' }
            }
          },
          include: {
            images: true,
            stores: {
              orderBy: { price: 'asc' },
              take: 1
            }
          },
          take: 3,
          orderBy: { stores: { _count: 'desc' } }
        })
        
        if (products.length > 0) {
          suggestions.push({
            category,
            products
          })
        }
      }
    }
    
    return suggestions
  }
}

export const collectionService = new CollectionService()