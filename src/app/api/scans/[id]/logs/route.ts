import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/scans/[id]/logs — Get logs for a scan with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const level = searchParams.get('level');

    const scan = await db.scan.findUnique({ where: { id } });
    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { scanId: id };
    if (level) {
      where.level = level;
    }

    const [logs, total] = await Promise.all([
      db.scanLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.scanLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch scan logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan logs' },
      { status: 500 }
    );
  }
}
