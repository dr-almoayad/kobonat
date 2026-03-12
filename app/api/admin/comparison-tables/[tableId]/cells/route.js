// app/api/admin/comparison-tables/[tableId]/cells/route.js
// PUT — batch upsert all cells for a table.
//
// Body: { cells: [{ columnId, rowId, textValueEn, textValueAr, numericValue, boolValue, isHighlighted }] }
// Each cell is upserted by (columnId, rowId) unique constraint.
// Cells NOT in the array are left untouched (use DELETE on columns/rows to clear them).

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function PUT(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;
  const { cells } = await req.json();

  if (!Array.isArray(cells)) {
    return NextResponse.json({ error: 'cells must be an array' }, { status: 400 });
  }

  // Batch upsert — Prisma doesn't have a native batch upsert, so we use a transaction
  const results = await prisma.$transaction(
    cells.map(cell => {
      const where  = { columnId_rowId: { columnId: parseInt(cell.columnId), rowId: parseInt(cell.rowId) } };
      const data   = {
        textValueEn:  cell.textValueEn  ?? null,
        textValueAr:  cell.textValueAr  ?? null,
        numericValue: cell.numericValue != null ? parseFloat(cell.numericValue) : null,
        boolValue:    cell.boolValue    != null ? Boolean(cell.boolValue) : null,
        isHighlighted: cell.isHighlighted ?? false,
      };
      return prisma.comparisonTableCell.upsert({
        where,
        create: { columnId: parseInt(cell.columnId), rowId: parseInt(cell.rowId), ...data },
        update: data,
      });
    })
  );

  return NextResponse.json({ saved: results.length });
}
