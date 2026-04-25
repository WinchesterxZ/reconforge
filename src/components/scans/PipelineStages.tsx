'use client';

import type { ScanStage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Clock, SkipForward } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PipelineStagesProps {
  stages: ScanStage[];
  selectedStageId: string | null;
  onSelectStage: (stageId: string) => void;
}

const stageStatusConfig: Record<string, { icon: React.ReactNode; bgClass: string; borderClass: string; textClass: string }> = {
  completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-400',
  },
  running: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/40',
    textClass: 'text-blue-400',
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/40',
    textClass: 'text-red-400',
  },
  skipped: {
    icon: <SkipForward className="h-3.5 w-3.5" />,
    bgClass: 'bg-gray-500/20',
    borderClass: 'border-gray-500/40',
    textClass: 'text-gray-400',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    bgClass: 'bg-muted/30',
    borderClass: 'border-border',
    textClass: 'text-muted-foreground',
  },
};

export function PipelineStages({ stages, selectedStageId, onSelectStage }: PipelineStagesProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-max">
          {stages.map((stage, i) => {
            const config = stageStatusConfig[stage.status];
            const isSelected = selectedStageId === stage.id;

            return (
              <div key={stage.id} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectStage(stage.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border transition-all cursor-pointer min-w-[80px]',
                        config.borderClass,
                        config.bgClass,
                        isSelected && 'ring-2 ring-primary/50',
                        stage.status === 'running' && 'pulse-running',
                      )}
                    >
                      <span className={config.textClass}>{config.icon}</span>
                      <span className={cn('text-[10px] leading-tight text-center truncate w-full', config.textClass)}>
                        {stage.displayName.length > 12
                          ? stage.displayName.slice(0, 12) + '...'
                          : stage.displayName}
                      </span>
                      {stage.status === 'running' && (
                        <span className="text-[9px] text-blue-400">{stage.progress}%</span>
                      )}
                      {stage.status === 'completed' && stage.findingsCount > 0 && (
                        <span className="text-[9px] text-emerald-400/70">{stage.findingsCount} found</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-popover border-border max-w-xs"
                  >
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-foreground">{stage.displayName}</p>
                      <p className={config.textClass}>Status: {stage.status}</p>
                      {stage.findingsCount > 0 && (
                        <p className="text-amber-400">{stage.findingsCount} findings</p>
                      )}
                      {stage.error && (
                        <p className="text-red-400">Error: {stage.error}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Connector line */}
                {i < stages.length - 1 && (
                  <div
                    className={cn(
                      'w-3 h-0.5 mx-0.5',
                      stage.status === 'completed' ? 'bg-emerald-500/40' : 'bg-border'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
