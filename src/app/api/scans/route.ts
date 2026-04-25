import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createScanStages, startScanSimulation } from '@/lib/scan-engine';

// GET /api/scans — List all scans with optional projectId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');

    const where = projectId ? { projectId } : {};

    const scans = await db.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true, domains: true },
        },
        _count: {
          select: { stages: true, findings: true, logs: true },
        },
      },
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Failed to fetch scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}

// POST /api/scans — Start a new scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create the scan
    const scan = await db.scan.create({
      data: {
        projectId,
        name: name || 'Full Recon',
        status: 'pending',
        progress: 0,
      },
    });

    // Create all scan stages
    await createScanStages(scan.id);

    // Start the scan simulation in the background (non-blocking)
    // Using .catch to prevent unhandled promise rejection
    const scanId = scan.id;
    const domains = project.domains;
    startScanSimulation(scanId, projectId, domains).catch((err) => {
      console.error('Scan simulation error:', err);
    });

    return NextResponse.json({ scan }, { status: 201 });
  } catch (error) {
    console.error('Failed to start scan:', error);
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    );
  }
}
