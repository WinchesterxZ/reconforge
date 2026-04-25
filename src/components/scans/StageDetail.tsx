'use client';

import type { ScanStage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  SkipForward,
  FileSearch,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageDetailProps {
  stage: ScanStage | null;
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  running: <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />,
  failed: <XCircle className="h-5 w-5 text-red-400" />,
  skipped: <SkipForward className="h-5 w-5 text-gray-400" />,
  pending: <Clock className="h-5 w-5 text-muted-foreground" />,
};

const statusBadge: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  skipped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending: 'bg-muted/30 text-muted-foreground border-border',
};

export function StageDetail({ stage }: StageDetailProps) {
  if (!stage) {
    return (
      <Card className="border-border bg-card h-full">
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          <div className="text-center">
            <FileSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Select a stage to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusIcons[stage.status]}
            <CardTitle className="text-sm font-medium text-foreground">
              {stage.displayName}
            </CardTitle>
          </div>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', statusBadge[stage.status])}>
            {stage.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn(
              'font-medium',
              stage.status === 'completed' ? 'text-emerald-400' :
              stage.status === 'running' ? 'text-blue-400' :
              stage.status === 'failed' ? 'text-red-400' :
              'text-muted-foreground'
            )}>
              {stage.progress}%
            </span>
          </div>
          <Progress
            value={stage.progress}
            className={cn(
              'h-2 bg-muted',
              stage.status === 'completed' && '[&>div]:bg-emerald-500',
              stage.status === 'running' && '[&>div]:bg-blue-500',
              stage.status === 'failed' && '[&>div]:bg-red-500'
            )}
          />
        </div>

        <Separator className="bg-border" />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground">Stage Name</span>
            <p className="terminal-text text-foreground">{stage.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Findings</span>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 font-medium">{stage.findingsCount}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Started</span>
            <p className="text-foreground">
              {stage.startedAt
                ? new Date(stage.startedAt).toLocaleTimeString()
                : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Completed</span>
            <p className="text-foreground">
              {stage.completedAt
                ? new Date(stage.completedAt).toLocaleTimeString()
                : '-'}
            </p>
          </div>
        </div>

        {/* Error */}
        {stage.error && (
          <>
            <Separator className="bg-border" />
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-400">Error</span>
              </div>
              <p className="text-xs text-red-400/80 terminal-text">{stage.error}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
