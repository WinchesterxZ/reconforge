import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/endpoints — List endpoints with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const statusCode = searchParams.get('statusCode');
    const search = searchParams.get('search');
    const soft404Only = searchParams.get('soft404') === 'true';
    const limit = parseInt(searchParams.get('limit') || '5000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (statusCode) where.statusCode = parseInt(statusCode, 10);
    if (soft404Only) where.isSoft404 = true;
    if (search) {
      where.OR = [
        { url: { contains: search } },
        { contentType: { contains: search } },
        { method: { contains: search } },
      ];
    }

    const [endpoints, total] = await Promise.all([
      db.endpoint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      db.endpoint.count({ where }),
    ]);

    return NextResponse.json({
      endpoints,
      total,
      limit,
      offset,
      hasMore: offset + endpoints.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch endpoints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch endpoints' },
      { status: 500 }
    );
  }
}
