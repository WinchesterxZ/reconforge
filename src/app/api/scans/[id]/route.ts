import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/scans/[id] — Get scan with stages and recent logs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scan = await db.scan.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, domains: true },
        },
        stages: {
          orderBy: { order: 'asc' },
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        _count: {
          select: { findings: true },
        },
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scan });
  } catch (error) {
    console.error('Failed to fetch scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan' },
      { status: 500 }
    );
  }
}
