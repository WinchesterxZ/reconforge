'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Project, Report } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  ShieldAlert,
  Globe,
  Link,
  AlertTriangle,
  ListChecks,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const sectionIcons: Record<string, React.ReactNode> = {
  executive_summary: <FileText className="h-4 w-4" />,
  attack_surface: <Globe className="h-4 w-4" />,
  subdomain_inventory: <Globe className="h-4 w-4" />,
  endpoint_categories: <Link className="h-4 w-4" />,
  vulnerability_summary: <ShieldAlert className="h-4 w-4" />,
  high_risk_findings: <AlertTriangle className="h-4 w-4" />,
  recommendations: <ListChecks className="h-4 w-4" />,
};

const sectionColors: Record<string, string> = {
  executive_summary: 'text-blue-400',
  attack_surface: 'text-emerald-400',
  subdomain_inventory: 'text-cyan-400',
  endpoint_categories: 'text-purple-400',
  vulnerability_summary: 'text-red-400',
  high_risk_findings: 'text-orange-400',
  recommendations: 'text-amber-400',
};

export function ReportsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const mapped = (data.projects || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        domains: (p.domains as string || '').split(',').map((d: string) => d.trim()).filter(Boolean),
        description: p.description as string || '',
        customHeaders: {},
        status: 'active' as const,
        subdomainCount: (p._count as Record<string, number>)?.subdomains || 0,
        endpointCount: (p._count as Record<string, number>)?.endpoints || 0,
        vulnerabilityCount: (p._count as Record<string, number>)?.vulnerabilities || 0,
        lastScanDate: null,
        createdAt: p.createdAt as string,
        updatedAt: p.updatedAt as string,
      }));
      setProjects(mapped);
      if (mapped.length > 0 && !selectedProjectId) {
        setSelectedProjectId(mapped[0].id);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch report when project is selected
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports?projectId=${selectedProjectId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setReportData(data.report || null);
      } catch {
        setReportData(null);
      }
    };
    fetchReport();
  }, [selectedProjectId]);

  const report: Report | null = useMemo(() => {
    if (!reportData) return null;
    const rd = reportData as Record<string, unknown>;
    const proj = rd.project as Record<string, unknown> || {};
    const summary = rd.summary as Record<string, number> || {};
    const vulnBreakdown = rd.vulnerabilityBreakdown as Record<string, Record<string, number>> || {};
    const bySeverity = vulnBreakdown.bySeverity || {};
    const epBreakdown = rd.endpointBreakdown as Record<string, Record<string, number>> || {};

    const sections = [
      {
        id: 'rs-1',
        title: 'Executive Summary',
        type: 'executive_summary' as const,
        content: `A comprehensive security assessment was performed on ${proj.name || 'the target'}. The assessment identified ${summary.totalSubdomains || 0} subdomains (${summary.aliveSubdomains || 0} alive), ${summary.totalEndpoints || 0} endpoints, and ${summary.totalVulnerabilities || 0} vulnerabilities. Of the vulnerabilities found, ${bySeverity.critical || 0} are Critical, ${bySeverity.high || 0} are High, ${bySeverity.medium || 0} are Medium, ${bySeverity.low || 0} are Low, and ${bySeverity.info || 0} are Informational. Immediate attention is required for the critical and high severity findings.`,
      },
      {
        id: 'rs-2',
        title: 'Attack Surface Overview',
        type: 'attack_surface' as const,
        content: `The attack surface comprises ${summary.totalSubdomains || 0} discovered subdomains with ${summary.aliveSubdomains || 0} alive and responding. A total of ${summary.totalEndpoints || 0} endpoints were discovered. ${summary.totalScans || 0} scans were performed with ${summary.completedScans || 0} completed. Key entry points should be prioritized for further testing.`,
      },
      {
        id: 'rs-3',
        title: 'Subdomain Inventory',
        type: 'subdomain_inventory' as const,
        content: `${summary.totalSubdomains || 0} subdomains were discovered through the reconnaissance pipeline. ${summary.aliveSubdomains || 0} subdomains are alive and responding to HTTP/HTTPS requests. Each subdomain should be individually assessed for vulnerabilities and misconfigurations.`,
      },
      {
        id: 'rs-4',
        title: 'Endpoint Categories',
        type: 'endpoint_categories' as const,
        content: `${summary.totalEndpoints || 0} endpoints were discovered and categorized: ${Object.entries(epBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No categories available'}. These endpoints represent the web attack surface and should be systematically tested.`,
      },
      {
        id: 'rs-5',
        title: 'Vulnerability Summary',
        type: 'vulnerability_summary' as const,
        content: `${summary.totalVulnerabilities || 0} vulnerabilities were identified: Critical (${bySeverity.critical || 0}), High (${bySeverity.high || 0}), Medium (${bySeverity.medium || 0}), Low (${bySeverity.low || 0}), Info (${bySeverity.info || 0}). The most critical findings require immediate remediation.`,
      },
      {
        id: 'rs-6',
        title: 'High-Risk Findings Detail',
        type: 'high_risk_findings' as const,
        content: `Critical and High severity vulnerabilities were identified that pose significant risk. ${(bySeverity.critical || 0) + (bySeverity.high || 0)} findings require immediate attention. Detailed remediation steps should be implemented for each finding.`,
      },
      {
        id: 'rs-7',
        title: 'Recommendations',
        type: 'recommendations' as const,
        content: `1. IMMEDIATE: Address all Critical severity vulnerabilities\n2. HIGH: Remediate High severity findings within 48 hours\n3. MEDIUM: Plan remediation for Medium severity findings within 2 weeks\n4. LOW: Schedule Low severity fixes in next maintenance window\n5. ONGOING: Implement continuous security monitoring and regular assessments`,
      },
    ];

    return {
      id: `report-${selectedProjectId}`,
      projectId: selectedProjectId,
      projectName: proj.name as string || 'Unknown',
      generatedAt: new Date().toISOString(),
      sections,
    };
  }, [reportData, selectedProjectId]);

  const handleExportPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Generating PDF report...',
    });
  };

  const handlePrint = () => {
    toast({
      title: 'Preparing Print',
      description: 'Opening print dialog...',
    });
  };

  const vulnBreakdown = (reportData as Record<string, unknown>)?.vulnerabilityBreakdown as Record<string, Record<string, number>> | undefined;
  const bySeverity = vulnBreakdown?.bySeverity || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Auto-generated security assessment reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="border-border text-foreground hover:bg-accent gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleExportPDF}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Project:</span>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-64 bg-card border-border text-foreground">
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {report && (
          <span className="text-xs text-muted-foreground">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Report Content */}
      {report ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Report Header */}
          <Card className="border-primary/20 bg-card glow-emerald">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/15">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Security Assessment Report
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {report.projectName} | Generated on{' '}
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                  {bySeverity.critical || 0} Critical
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                  {bySeverity.high || 0} High
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {bySeverity.medium || 0} Medium
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {bySeverity.low || 0} Low
                </Badge>
                <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                  {bySeverity.info || 0} Info
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Accordion type="multiple" defaultValue={['rs-1', 'rs-5', 'rs-6']} className="space-y-2">
            {report.sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem value={section.id} className="border border-border bg-card rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={cn(sectionColors[section.type])}>
                        {sectionIcons[section.type]}
                      </span>
                      <span className="text-sm font-medium text-foreground text-left">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Select a project to generate a report</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
