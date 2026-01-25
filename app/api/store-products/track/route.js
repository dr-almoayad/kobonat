// ============================================================================
// API ROUTE: app/api/store-products/track/route.js
// ============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    // Get IP and user agent
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    // Hash IP for privacy
    const crypto = require('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    // Record click
    await prisma.storeProductClick.create({
      data: {
        productId: parseInt(productId),
        ipHash,
        userAgent: userAgent.substring(0, 255),
        referrer: referrer.substring(0, 500)
      }
    });

    // Update click count
    await prisma.storeProduct.update({
      where: { id: parseInt(productId) },
      data: {
        clickCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Track product click error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
