'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LogEntry, ScanStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LiveLogsProps {
  scanId: string;
  status?: ScanStatus;
}

interface ApiLog {
  id: string;
  scanId: string;
  level: string;
  message: string;
  timestamp: string;
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

/** Extract stage name from a message like "[subdomain_enum] Starting..." */
function extractStage(message: string): string {
  const match = message.match(/^\[([^\]]+)\]/);
  return match ? match[1] : '';
}

function mapApiLogToEntry(log: ApiLog): LogEntry {
  return {
    id: log.id,
    timestamp: log.timestamp,
    level: log.level as LogEntry['level'],
    stage: extractStage(log.message),
    message: log.message,
  };
}

export function LiveLogs({ scanId, status }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scans/${scanId}/logs?limit=50`);
      if (!res.ok) {
        throw new Error(`Failed to fetch logs (${res.status})`);
      }
      const data = await res.json();
      // API returns logs in timestamp desc order; reverse for chronological display
      const entries = (data.logs || []).map(mapApiLogToEntry).reverse();
      setLogs((prev) => {
        // Deduplicate: only append entries we haven't seen yet
        const existingIds = new Set(prev.map((l) => l.id));
        const newEntries = entries.filter((e: LogEntry) => !existingIds.has(e.id));
        // Keep chronological order — existing logs first, then new ones appended
        return [...prev, ...newEntries];
      });
      // Track the newest log id so we can detect gaps
      if (entries.length > 0) {
        lastFetchedRef.current = entries[entries.length - 1].id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  // Initial fetch and re-fetch when scanId changes
  useEffect(() => {
    setLogs([]);
    lastFetchedRef.current = null;
    fetchLogs();
  }, [fetchLogs]);

  // Poll every 5 seconds while scan is running or pending
  useEffect(() => {
    const isPollingStatus = status === 'running' || status === 'pending';
    if (!isPollingStatus) return;

    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [status, fetchLogs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const isPollingStatus = status === 'running' || status === 'pending';

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Live Logs
            {isPollingStatus && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
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
          {error && (
            <div className="text-red-400 text-xs text-center py-4">
              {error}
            </div>
          )}
          {!error && logs.length === 0 && loading && (
            <div className="text-muted-foreground text-xs text-center py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading logs...
            </div>
          )}
          {!error && logs.length === 0 && !loading && (
            <div className="text-muted-foreground text-xs text-center py-8">
              Waiting for logs...
            </div>
          )}
          {logs.length > 0 && (
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
                  {log.stage && (
                    <span className="text-primary/70 shrink-0 w-28 truncate">
                      [{log.stage}]
                    </span>
                  )}
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
