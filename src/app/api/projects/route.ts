import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects — List all projects with counts
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            subdomains: true,
            endpoints: true,
            vulnerabilities: true,
            scans: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects — Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domains, headers, description } = body;

    if (!name || !domains) {
      return NextResponse.json(
        { error: 'Name and domains are required' },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        name,
        domains: Array.isArray(domains) ? domains.join(',') : domains,
        headers: headers ? JSON.stringify(headers) : '{}',
        description: description || '',
        status: 'active',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
