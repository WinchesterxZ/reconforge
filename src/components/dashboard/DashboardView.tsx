'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatsCards } from './StatsCards';
import { ActivityChart } from './ActivityChart';
import { RecentFindings } from './RecentFindings';
import { PipelineOverview } from './PipelineOverview';
import { useAppStore } from '@/lib/store';
import { getMockDashboardStats, getMockScans, getMockFindings } from '@/lib/api';
import type { DashboardStats, Scan, Finding } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Radar } from 'lucide-react';

interface ApiFinding {
  id: string;
  scanId: string;
  category: string;
  severity: string;
  url: string;
  title: string;
  data: string;
  verified: boolean;
  createdAt: string;
}

interface ApiScan {
  id: string;
  projectId: string;
  name: string;
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  stages?: Array<{
    id: string;
    scanId: string;
    stageName: string;
    displayName: string;
    status: string;
    progress: number;
    resultsCount: number;
    startedAt: string | null;
    completedAt: string | null;
  }>;
}

export function DashboardView() {
  const { setView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>(getMockDashboardStats());
  const [scans, setScans] = useState<Scan[]>(getMockScans());
  const [findings, setFindings] = useState<Finding[]>(getMockFindings());
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch projects for stats
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      const projects = projectsData.projects || [];

      // Fetch scans
      const scansRes = await fetch('/api/scans');
      const scansData = await scansRes.json();
      const apiScans = scansData.scans || [];

      // Fetch findings
      const findingsRes = await fetch('/api/findings?limit=10');
      const findingsData = await findingsRes.json();
      const apiFindings = findingsData.findings || [];

      // Calculate stats
      const totalSubdomains = projects.reduce(
        (sum: number, p: { _count: { subdomains: number } }) => sum + (p._count?.subdomains || 0), 0
      );
      const totalVulns = projects.reduce(
        (sum: number, p: { _count: { vulnerabilities: number } }) => sum + (p._count?.vulnerabilities || 0), 0
      );
      const activeScans = apiScans.filter((s: ApiScan) => s.status === 'running').length;

      setStats({
        totalTargets: projects.length,
        subdomainsFound: totalSubdomains,
        vulnerabilities: totalVulns,
        activeScans,
      });

      // Map scans
      const mappedScans: Scan[] = apiScans.map((s: ApiScan) => {
        const stageNames = [
          'subdomain_enum', 'dns_resolution', 'http_probing', 'web_screenshot',
          'port_scan', 'service_detect', 'waf_detect', 'tech_detect',
          'crawler', 'link_finding', 'js_analysis', 'api_discovery',
          'dir_fuzz', 'param_mining', 'fuzz_params', 'sensitive_check',
          'login_detect', 'idor_check', 'xss_scan', 'sqli_scan',
          'ssrf_check', 'vuln_scan', 'report_gen',
        ];
        const stageDisplayNames = [
          'Subdomain Enum', 'DNS Resolution', 'HTTP Probing', 'Web Screenshot',
          'Port Scanning', 'Service Detect', 'WAF Detection', 'Tech Detection',
          'Web Crawling', 'Link Finding', 'JS Analysis', 'API Discovery',
          'Dir Fuzzing', 'Param Mining', 'Param Fuzzing', 'Sensitive Check',
          'Login Detect', 'IDOR Check', 'XSS Scanning', 'SQLi Scanning',
          'SSRF Check', 'Vuln Scan', 'Report Gen',
        ];

        const stages = s.stages || stageNames.map((name, i) => {
          const completedUpTo = Math.floor((s.progress / 100) * stageNames.length);
          let status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
          if (i < completedUpTo) status = 'completed';
          else if (i === completedUpTo && s.status === 'running') status = 'running';
          return {
            id: `stage-${s.id}-${i}`,
            name,
            displayName: stageDisplayNames[i],
            status,
            progress: status === 'completed' ? 100 : status === 'running' ? Math.floor(Math.random() * 80) + 10 : 0,
            startedAt: status !== 'pending' ? s.startedAt || s.createdAt : null,
            completedAt: status === 'completed' ? s.completedAt || s.updatedAt : null,
            findingsCount: status === 'completed' ? Math.floor(Math.random() * 30) + 1 : 0,
            error: null,
          };
        });

        const currentStageIdx = stages.findIndex((st) => st.status === 'running');
        const currentStageName = currentStageIdx >= 0 ? stages[currentStageIdx].name : 'idle';

        return {
          id: s.id,
          projectId: s.projectId,
          projectName: s.project?.name || 'Unknown',
          status: s.status as Scan['status'],
          progress: s.progress,
          currentStage: currentStageName,
          startedAt: s.startedAt || s.createdAt,
          completedAt: s.completedAt,
          createdAt: s.createdAt,
          stages,
        };
      });

      setScans(mappedScans.length > 0 ? mappedScans : getMockScans());

      // Map findings
      const mappedFindings: Finding[] = apiFindings.map((f: ApiFinding) => ({
        id: f.id,
        scanId: f.scanId,
        stageName: f.category,
        type: f.category as Finding['type'],
        severity: f.severity as Finding['severity'],
        title: f.title,
        description: f.url,
        url: f.url,
        data: {},
        discoveredAt: f.createdAt,
      }));

      setFindings(mappedFindings.length > 0 ? mappedFindings : getMockFindings());
    } catch {
      // Fall back to mock data
      setStats(getMockDashboardStats());
      setScans(getMockScans());
      setFindings(getMockFindings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setView('targets')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Target
        </Button>
        <Button
          variant="outline"
          onClick={() => setView('scans')}
          className="border-border gap-2 text-foreground hover:bg-accent"
        >
          <Radar className="h-4 w-4" />
          Start Scan
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts + Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <RecentFindings findings={findings} />
        </div>
      </div>

      {/* Pipeline Overview */}
      <PipelineOverview scans={scans} />
    </div>
  );
}
