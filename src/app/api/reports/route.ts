import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports — Generate report data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');

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

    // Gather all data in parallel
    const [
      subdomains,
      aliveSubdomains,
      endpoints,
      vulnerabilities,
      scans,
      findings,
    ] = await Promise.all([
      db.subdomain.findMany({ where: { projectId } }),
      db.subdomain.findMany({ where: { projectId, alive: true } }),
      db.endpoint.findMany({ where: { projectId } }),
      db.vulnerability.findMany({ where: { projectId } }),
      db.scan.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      db.finding.findMany({
        where: { scan: { projectId } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Compute vulnerability stats by severity
    const vulnBySeverity = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length,
    };

    // Compute vulnerability stats by status
    const vulnByStatus = {
      open: vulnerabilities.filter(v => v.status === 'open').length,
      confirmed: vulnerabilities.filter(v => v.status === 'confirmed').length,
      false_positive: vulnerabilities.filter(v => v.status === 'false_positive').length,
      fixed: vulnerabilities.filter(v => v.status === 'fixed').length,
    };

    // Compute endpoint stats by category
    const endpointsByCategory: Record<string, number> = {};
    for (const ep of endpoints) {
      endpointsByCategory[ep.category] = (endpointsByCategory[ep.category] || 0) + 1;
    }

    // Compute findings by category
    const findingsByCategory: Record<string, number> = {};
    for (const finding of findings) {
      findingsByCategory[finding.category] = (findingsByCategory[finding.category] || 0) + 1;
    }

    // Top web servers
    const webServerCounts: Record<string, number> = {};
    for (const sub of subdomains) {
      if (sub.webServer) {
        webServerCounts[sub.webServer] = (webServerCounts[sub.webServer] || 0) + 1;
      }
    }

    // Technology stack distribution
    const techCounts: Record<string, number> = {};
    for (const sub of subdomains) {
      try {
        const techs = JSON.parse(sub.techStack) as string[];
        for (const tech of techs) {
          techCounts[tech] = (techCounts[tech] || 0) + 1;
        }
      } catch {
        // ignore parse errors
      }
    }

    // Subdomain source distribution
    const sourceCounts: Record<string, number> = {};
    for (const sub of subdomains) {
      if (sub.source) {
        sourceCounts[sub.source] = (sourceCounts[sub.source] || 0) + 1;
      }
    }

    // Scan history summary
    const scanSummary = scans.map(scan => ({
      id: scan.id,
      name: scan.name,
      status: scan.status,
      progress: scan.progress,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      createdAt: scan.createdAt,
    }));

    // Vulnerability types distribution
    const vulnByType: Record<string, number> = {};
    for (const vuln of vulnerabilities) {
      if (vuln.type) {
        vulnByType[vuln.type] = (vulnByType[vuln.type] || 0) + 1;
      }
    }

    // Status code distribution for endpoints
    const statusCodeDistribution: Record<string, number> = {};
    for (const ep of endpoints) {
      const key = String(ep.statusCode);
      statusCodeDistribution[key] = (statusCodeDistribution[key] || 0) + 1;
    }

    const report = {
      project: {
        id: project.id,
        name: project.name,
        domains: project.domains,
        status: project.status,
        createdAt: project.createdAt,
      },
      summary: {
        totalSubdomains: subdomains.length,
        aliveSubdomains: aliveSubdomains.length,
        totalEndpoints: endpoints.length,
        totalVulnerabilities: vulnerabilities.length,
        totalFindings: findings.length,
        totalScans: scans.length,
        completedScans: scans.filter(s => s.status === 'completed').length,
      },
      vulnerabilityBreakdown: {
        bySeverity: vulnBySeverity,
        byStatus: vulnByStatus,
        byType: vulnByType,
      },
      endpointBreakdown: {
        byCategory: endpointsByCategory,
        byStatusCode: statusCodeDistribution,
      },
      findingsBreakdown: {
        byCategory: findingsByCategory,
      },
      infrastructure: {
        webServers: webServerCounts,
        technologies: techCounts,
        subdomainSources: sourceCounts,
      },
      scanHistory: scanSummary,
      // Top critical/high vulnerabilities
      criticalVulns: vulnerabilities
        .filter(v => v.severity === 'critical' || v.severity === 'high')
        .slice(0, 10)
        .map(v => ({
          id: v.id,
          title: v.title,
          severity: v.severity,
          url: v.url,
          type: v.type,
          status: v.status,
        })),
      // Most recent findings
      recentFindings: findings.slice(0, 20).map(f => ({
        id: f.id,
        title: f.title,
        category: f.category,
        severity: f.severity,
        url: f.url,
        createdAt: f.createdAt,
      })),
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
