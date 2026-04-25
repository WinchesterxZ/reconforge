'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/lib/types';
import { getMockLogs } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LiveLogsProps {
  scanId: string;
  logs?: LogEntry[];
}

const levelColors: Record<string, string> = {
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-gray-500',
  success: 'text-emerald-400',
};

const levelBadges: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400',
  warn: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
  debug: 'bg-gray-500/20 text-gray-400',
  success: 'bg-emerald-500/20 text-emerald-400',
};

export function LiveLogs({ scanId, logs: propLogs }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>(() => propLogs || getMockLogs());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate new log entries arriving
  useEffect(() => {
    const timer = setInterval(() => {
      setLogs((prev) => {
        if (prev.length > 50) return prev;
        const newLog: LogEntry = {
          id: `l-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: ['info', 'success', 'warn'][Math.floor(Math.random() * 3)] as LogEntry['level'],
          stage: 'js_analysis',
          message: [
            'Processing JavaScript file...',
            'Analyzing API endpoints...',
            'Checking parameter values...',
            'Evaluating response headers...',
            'Testing for common misconfigurations...',
          ][Math.floor(Math.random() * 5)],
        };
        return [...prev, newLog];
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Live Logs
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogs([])}
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto rounded-md bg-[#0a0a0f] p-3 border border-border"
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-xs text-center py-8">
              Waiting for logs...
            </div>
          ) : (
            <div className="space-y-0.5 terminal-text text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-white/[0.02] px-1 rounded">
                  <span className="text-muted-foreground shrink-0 w-16">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1 py-0 h-3.5 shrink-0 w-12 justify-center',
                      levelBadges[log.level]
                    )}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-primary/70 shrink-0 w-28 truncate">
                    [{log.stage}]
                  </span>
                  <span className={cn('flex-1', levelColors[log.level])}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
