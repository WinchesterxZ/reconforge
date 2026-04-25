'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Scan } from '@/lib/types';
import { getMockScans } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface PipelineOverviewProps {
  scans?: Scan[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
  running: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-muted-foreground',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
};

export function PipelineOverview({ scans }: PipelineOverviewProps) {
  const data = scans || getMockScans().filter((s) => s.status === 'running' || s.status === 'pending');
  const { setView, selectScan } = useAppStore();

  const handleViewScan = (scanId: string) => {
    selectScan(scanId);
    setView('scans');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.3 }}
    >
      <Card className="border-border bg-card h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground">
              Active Scans
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/80"
              onClick={() => setView('scans')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No active scans
              </div>
            ) : (
              data.map((scan, i) => {
                const config = statusConfig[scan.status];
                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewScan(scan.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className="text-sm font-medium text-foreground">
                          {scan.projectName}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${config.badge}`}>
                        {scan.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground terminal-text">
                          {scan.currentStage}
                        </span>
                        <span className="text-muted-foreground">{scan.progress}%</span>
                      </div>
                      <Progress
                        value={scan.progress}
                        className="h-1.5 bg-muted"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-2.5 w-2.5" />
                        {scan.stages.filter((s) => s.status === 'completed').length}/{scan.stages.length} stages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {scan.startedAt
                          ? new Date(scan.startedAt).toLocaleTimeString()
                          : 'Not started'}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
