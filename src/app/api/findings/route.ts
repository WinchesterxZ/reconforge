import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/findings — List findings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause for findings through scans
    const scanWhere: Record<string, unknown> = {};
    if (projectId) scanWhere.projectId = projectId;

    const findingWhere: Record<string, unknown> = {};
    if (projectId) {
      findingWhere.scan = { projectId };
    }
    if (category) findingWhere.category = category;
    if (severity) findingWhere.severity = severity;
    if (search) {
      findingWhere.OR = [
        { title: { contains: search } },
        { url: { contains: search } },
      ];
    }

    const [findings, total] = await Promise.all([
      db.finding.findMany({
        where: findingWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          scan: {
            select: {
              id: true,
              name: true,
              projectId: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.finding.count({ where: findingWhere }),
    ]);

    return NextResponse.json({
      findings,
      total,
      limit,
      offset,
      hasMore: offset + findings.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch findings' },
      { status: 500 }
    );
  }
}
