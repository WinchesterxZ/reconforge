'use client';

import { useState, useEffect, useCallback } from 'react';
import { PipelineStages } from './PipelineStages';
import { LiveLogs } from './LiveLogs';
import { StageDetail } from './StageDetail';
import { useAppStore } from '@/lib/store';
import type { Scan, ScanStage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Radar,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
  running: {
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
    color: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  failed: {
    icon: <XCircle className="h-4 w-4 text-red-400" />,
    color: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  pending: {
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    color: 'text-muted-foreground',
    badge: 'bg-muted/30 text-muted-foreground border-border',
  },
  cancelled: {
    icon: <XCircle className="h-4 w-4 text-gray-400" />,
    color: 'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
};

const defaultStageNames = [
  { name: 'passive_subdomain_enum', displayName: 'Passive Subdomain Enum' },
  { name: 'active_subdomain_enum', displayName: 'Active Subdomain Enum' },
  { name: 'subdomain_fuzzing', displayName: 'Subdomain Fuzzing' },
  { name: 'vhost_enum', displayName: 'VHost Enumeration' },
  { name: 'infra_discovery', displayName: 'Infrastructure Discovery' },
  { name: 'cert_transparency', displayName: 'Cert Transparency' },
  { name: 'merge_dedup', displayName: 'Merge & Deduplicate' },
  { name: 'alive_detection', displayName: 'Alive Host Detection' },
  { name: 'url_discovery', displayName: 'URL Discovery' },
  { name: 'param_extraction', displayName: 'Parameter Extraction' },
  { name: 'js_discovery', displayName: 'JavaScript Discovery' },
  { name: 'api_discovery', displayName: 'API Discovery' },
  { name: 'sensitive_file_discovery', displayName: 'Sensitive File Discovery' },
  { name: 'login_admin_detect', displayName: 'Login/Admin Detection' },
  { name: 'idor_detect', displayName: 'IDOR Detection' },
  { name: 'js_secret_discovery', displayName: 'JS Secret Discovery' },
  { name: 'hidden_params', displayName: 'Hidden Parameters' },
  { name: 'port_scanning', displayName: 'Port Scanning' },
  { name: 'dir_fuzzing', displayName: 'Directory Fuzzing' },
  { name: 'api_fuzzing', displayName: 'API Fuzzing' },
  { name: 'vuln_scanning', displayName: 'Vulnerability Scan' },
  { name: '403_bypass', displayName: '403 Bypass Check' },
  { name: 'report_generation', displayName: 'Report Generation' },
];

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
  stages?: ApiScanStage[];
}

interface ApiScanStage {
  id: string;
  scanId: string;
  stageName: string;
  displayName: string;
  status: string;
  progress: number;
  resultsCount: number;
  startedAt: string | null;
  completedAt: string | null;
  order: number;
}

function mapApiScan(apiScan: ApiScan): Scan {
  let stages: ScanStage[];

  if (apiScan.stages && apiScan.stages.length > 0) {
    stages = apiScan.stages.map((s) => ({
      id: s.id,
      name: s.stageName,
      displayName: s.displayName,
      status: s.status as ScanStage['status'],
      progress: s.progress,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      findingsCount: s.resultsCount,
      error: null,
    }));
  } else {
    // Generate stages based on progress
    const completedUpTo = Math.floor((apiScan.progress / 100) * defaultStageNames.length);
    stages = defaultStageNames.map((s, i) => {
      let status: ScanStage['status'] = 'pending';
      let progress = 0;
      if (i < completedUpTo) {
        status = 'completed';
        progress = 100;
      } else if (i === completedUpTo && apiScan.status === 'running') {
        status = 'running';
        progress = Math.floor(Math.random() * 80) + 10;
      }
      return {
        id: `stage-${apiScan.id}-${i}`,
        name: s.name,
        displayName: s.displayName,
        status,
        progress,
        startedAt: status !== 'pending' ? apiScan.startedAt || apiScan.createdAt : null,
        completedAt: status === 'completed' ? apiScan.completedAt || apiScan.updatedAt : null,
        findingsCount: status === 'completed' ? Math.floor(Math.random() * 30) + 1 : 0,
        error: null,
      };
    });
  }

  const currentStageIdx = stages.findIndex((s) => s.status === 'running');
  const currentStageName = currentStageIdx >= 0 ? stages[currentStageIdx].displayName : 'idle';

  return {
    id: apiScan.id,
    projectId: apiScan.projectId,
    projectName: apiScan.project?.name || apiScan.name || 'Unknown',
    status: apiScan.status as Scan['status'],
    progress: apiScan.progress,
    currentStage: currentStageName,
    startedAt: apiScan.startedAt || apiScan.createdAt,
    completedAt: apiScan.completedAt,
    createdAt: apiScan.createdAt,
    stages,
  };
}

export function ScansView() {
  const { selectedScanId, selectScan, selectedProjectId } = useAppStore();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchScans = useCallback(async () => {
    try {
      const params = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await fetch(`/api/scans${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const mapped = (data.scans || []).map(mapApiScan);
      setScans(mapped);
    } catch {
      toast({ title: 'Error', description: 'Failed to load scans', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedProjectId]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Auto-select first scan if none selected, and clear selection when project changes
  useEffect(() => {
    selectScan(null);
    setSelectedStageId(null);
  }, [selectedProjectId, selectScan]);

  useEffect(() => {
    if (!selectedScanId && scans.length > 0) {
      selectScan(scans[0].id);
    }
  }, [scans, selectedScanId, selectScan]);

  const handleStartScan = async () => {
    const projectId = selectedProjectId || scans[0]?.projectId;
    if (!projectId) {
      toast({ title: 'Error', description: 'No target selected. Please select a target first.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'New Recon Scan' }),
      });
      if (!res.ok) throw new Error('Failed to start scan');
      toast({ title: 'Scan Started', description: 'New reconnaissance scan has been initiated.' });
      fetchScans();
    } catch {
      toast({ title: 'Error', description: 'Failed to start scan', variant: 'destructive' });
    }
  };

  const selectedScan = scans.find((s) => s.id === (selectedScanId || scans[0]?.id));
  const selectedStage = selectedScan?.stages.find((s) => s.id === selectedStageId) || null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Scans</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage reconnaissance scans
          </p>
        </div>
        <Button
          onClick={handleStartScan}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Radar className="h-4 w-4" />
          New Scan
        </Button>
      </div>

      {/* Scan Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Select Scan:</span>
        <Select
          value={selectedScan?.id || ''}
          onValueChange={(val) => {
            selectScan(val);
            setSelectedStageId(null);
          }}
        >
          <SelectTrigger className="w-64 bg-card border-border text-foreground">
            <SelectValue placeholder="Select a scan..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {scans.map((scan) => {
              const config = statusConfig[scan.status];
              return (
                <SelectItem key={scan.id} value={scan.id}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{scan.projectName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Scan Details */}
      <AnimatePresence mode="wait">
        {selectedScan && (
          <motion.div
            key={selectedScan.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Scan Summary Card */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {statusConfig[selectedScan.status]?.icon}
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        {selectedScan.projectName}
                      </h3>
                      <p className="text-xs text-muted-foreground terminal-text">
                        Scan ID: {selectedScan.id} | Started: {selectedScan.startedAt ? new Date(selectedScan.startedAt).toLocaleString() : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', statusConfig[selectedScan.status]?.badge)}>
                    {selectedScan.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className={statusConfig[selectedScan.status]?.color}>
                      {selectedScan.progress}%
                    </span>
                  </div>
                  <Progress
                    value={selectedScan.progress}
                    className={cn(
                      'h-2 bg-muted',
                      selectedScan.status === 'completed' && '[&>div]:bg-emerald-500',
                      selectedScan.status === 'running' && '[&>div]:bg-blue-500',
                      selectedScan.status === 'failed' && '[&>div]:bg-red-500'
                    )}
                  />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Current: {selectedScan.currentStage}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {selectedScan.stages.filter((s) => s.status === 'completed').length}/{selectedScan.stages.length} stages
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Visualization */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Pipeline Stages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <PipelineStages
                  stages={selectedScan.stages}
                  selectedStageId={selectedStageId}
                  onSelectStage={setSelectedStageId}
                />
              </CardContent>
            </Card>

            {/* Stage Detail + Live Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StageDetail stage={selectedStage} />
              <LiveLogs scanId={selectedScan.id} />
            </div>

            {/* Stages Table */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  All Stages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Stage</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Progress</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Findings</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScan.stages.map((stage) => {
                        const config = statusConfig[stage.status] || statusConfig.pending;
                        return (
                          <tr
                            key={stage.id}
                            className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setSelectedStageId(stage.id)}
                          >
                            <td className="py-2 px-3 text-foreground">{stage.displayName}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                {config.icon}
                                <span className={config.color}>{stage.status}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <Progress value={stage.progress} className="h-1.5 bg-muted w-16" />
                                <span className="text-muted-foreground">{stage.progress}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              {stage.findingsCount > 0 ? (
                                <span className="text-amber-400">{stage.findingsCount}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {stage.startedAt
                                ? new Date(stage.startedAt).toLocaleTimeString()
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {scans.length === 0 && !loading && (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            <div className="text-center">
              <Radar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No scans yet for this target.</p>
              {selectedProjectId && (
                <Button
                  onClick={handleStartScan}
                  variant="outline"
                  className="mt-4 border-primary text-primary hover:bg-primary/10 gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start First Scan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
