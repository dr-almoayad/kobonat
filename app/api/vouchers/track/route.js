// app/api/vouchers/track/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function POST(req) {
  try {
    const body = await req.json();
    const { voucherId, countryCode } = body;

    if (!voucherId) {
      return NextResponse.json(
        { error: "voucherId required" },
        { status: 400 }
      );
    }

    // Get IP and user agent for tracking
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    // Simple hash for privacy
    const crypto = require('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    // Get country ID if countryCode provided
    let countryId = null;
    if (countryCode) {
      const country = await prisma.country.findUnique({
        where: { code: countryCode }
      });
      countryId = country?.id || null;
    }

    // Record click with country info
    await prisma.voucherClick.create({
      data: {
        voucherId: parseInt(voucherId),
        ipHash,
        userAgent: userAgent.substring(0, 255),
        referrer: referrer.substring(0, 500),
        countryId,
        clickedAt: new Date()
      }
    });

    // Update popularity score
    await prisma.voucher.update({
      where: { id: parseInt(voucherId) },
      data: {
        popularityScore: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error("Track click error:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}