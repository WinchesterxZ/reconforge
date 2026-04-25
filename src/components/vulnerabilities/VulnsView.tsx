'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VulnTable } from './VulnTable';
import type { Vulnerability, VulnSeverity, VulnStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Info,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const severitySummary = [
  { key: 'critical' as VulnSeverity, label: 'Critical', icon: <AlertOctagon className="h-4 w-4" />, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  { key: 'high' as VulnSeverity, label: 'High', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { key: 'medium' as VulnSeverity, label: 'Medium', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { key: 'low' as VulnSeverity, label: 'Low', icon: <Info className="h-4 w-4" />, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { key: 'info' as VulnSeverity, label: 'Info', icon: <Info className="h-4 w-4" />, color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20' },
];

export function VulnsView() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const fetchVulns = useCallback(async () => {
    try {
      const params = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await fetch(`/api/vulnerabilities${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const mapped: Vulnerability[] = (data.vulnerabilities || []).map((v: Record<string, unknown>) => ({
        id: v.id as string,
        projectId: v.projectId as string,
        title: v.title as string,
        severity: v.severity as VulnSeverity,
        url: v.url as string,
        type: v.type as string || (v.template as string || '').split('/')[0] || 'unknown',
        status: v.status as VulnStatus,
        description: v.description as string || '',
        evidence: '',
        remediation: '',
        cwe: null,
        cvss: null,
        discoveredAt: v.createdAt as string,
        updatedAt: v.updatedAt as string,
      }));
      setVulnerabilities(mapped);
    } catch {
      toast({ title: 'Error', description: 'Failed to load vulnerabilities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedProjectId]);

  useEffect(() => {
    fetchVulns();
  }, [fetchVulns]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    vulnerabilities.forEach((v) => {
      result[v.severity] = (result[v.severity] || 0) + 1;
    });
    return result;
  }, [vulnerabilities]);

  const vulnTypes = useMemo(() => {
    const types = new Set(vulnerabilities.map((v) => v.type));
    return Array.from(types);
  }, [vulnerabilities]);

  const filteredVulnerabilities = useMemo(() => {
    let result = vulnerabilities;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.url.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
      );
    }

    if (severityFilter !== 'all') {
      result = result.filter((v) => v.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((v) => v.type === typeFilter);
    }

    return result;
  }, [vulnerabilities, search, severityFilter, statusFilter, typeFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/vulnerabilities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setVulnerabilities((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: status as VulnStatus, updatedAt: new Date().toISOString() } : v))
      );
      toast({
        title: 'Status Updated',
        description: `Vulnerability status changed to ${status.replace('_', ' ')}.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSeverityFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasFilters = search || severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg border border-border bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vulnerabilities</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage discovered vulnerabilities
          </p>
        </div>
      </div>

      {/* Severity Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {severitySummary.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={cn('border cursor-pointer hover:bg-card/80 transition-colors', item.borderColor)}
              onClick={() => setSeverityFilter(severityFilter === item.key ? 'all' : item.key)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', item.bgColor)}>
                  <span className={item.color}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-lg font-bold terminal-text text-foreground">{counts[item.key] || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vulnerabilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 bg-card border-border text-foreground text-sm"
          />
        </div>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-32 h-8 bg-card border-border text-foreground text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Severity</SelectItem>
            <SelectItem value="critical" className="text-xs">Critical</SelectItem>
            <SelectItem value="high" className="text-xs">High</SelectItem>
            <SelectItem value="medium" className="text-xs">Medium</SelectItem>
            <SelectItem value="low" className="text-xs">Low</SelectItem>
            <SelectItem value="info" className="text-xs">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 bg-card border-border text-foreground text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="open" className="text-xs">Open</SelectItem>
            <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
            <SelectItem value="false_positive" className="text-xs">False Positive</SelectItem>
            <SelectItem value="fixed" className="text-xs">Fixed</SelectItem>
            <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-28 h-8 bg-card border-border text-foreground text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            {vulnTypes.map((type) => (
              <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
      </div>

      {/* Vulnerability Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {filteredVulnerabilities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No vulnerabilities found matching your filters.
            </div>
          ) : (
            <VulnTable
              vulnerabilities={filteredVulnerabilities}
              onStatusChange={handleStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
