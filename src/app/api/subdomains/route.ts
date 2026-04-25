import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subdomains — List subdomains with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');
    const alive = searchParams.get('alive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '5000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (alive !== null && alive !== undefined && alive !== '') {
      where.alive = alive === 'true';
    }
    if (search) {
      where.OR = [
        { domain: { contains: search } },
        { ip: { contains: search } },
        { webServer: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const [subdomains, total] = await Promise.all([
      db.subdomain.findMany({
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
      db.subdomain.count({ where }),
    ]);

    return NextResponse.json({
      subdomains,
      total,
      limit,
      offset,
      hasMore: offset + subdomains.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch subdomains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomains' },
      { status: 500 }
    );
  }
}
