import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/vulnerabilities — List vulnerabilities with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '5000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { url: { contains: search } },
        { description: { contains: search } },
        { template: { contains: search } },
        { type: { contains: search } },
      ];
    }

    const [vulnerabilities, total] = await Promise.all([
      db.vulnerability.findMany({
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
      db.vulnerability.count({ where }),
    ]);

    return NextResponse.json({
      vulnerabilities,
      total,
      limit,
      offset,
      hasMore: offset + vulnerabilities.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerabilities' },
      { status: 500 }
    );
  }
}

// PATCH /api/vulnerabilities — Update vulnerability status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Vulnerability id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'confirmed', 'false_positive', 'fixed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const vulnerability = await db.vulnerability.findUnique({ where: { id } });
    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    const updated = await db.vulnerability.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ vulnerability: updated });
  } catch (error) {
    console.error('Failed to update vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to update vulnerability' },
      { status: 500 }
    );
  }
}
