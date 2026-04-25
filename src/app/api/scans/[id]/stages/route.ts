import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/scans/[id]/stages — Get all stages for a scan
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scan = await db.scan.findUnique({ where: { id } });
    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    const stages = await db.scanStage.findMany({
      where: { scanId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Failed to fetch scan stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan stages' },
      { status: 500 }
    );
  }
}
