'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Finding } from '@/lib/types';
import { getMockFindings } from '@/lib/api';
import { motion } from 'framer-motion';
import { AlertTriangle, Globe, Code, Shield, FileSearch } from 'lucide-react';

interface RecentFindingsProps {
  findings?: Finding[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const typeIcons: Record<string, React.ReactNode> = {
  vulnerability: <Shield className="h-3.5 w-3.5" />,
  subdomain: <Globe className="h-3.5 w-3.5" />,
  endpoint: <FileSearch className="h-3.5 w-3.5" />,
  sensitive: <AlertTriangle className="h-3.5 w-3.5" />,
  technology: <Code className="h-3.5 w-3.5" />,
  info: <AlertTriangle className="h-3.5 w-3.5" />,
};

export function RecentFindings({ findings }: RecentFindingsProps) {
  const data = findings || getMockFindings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <Card className="border-border bg-card h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            Recent Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {data.map((finding, i) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    {typeIcons[finding.type] || <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {finding.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${severityColors[finding.severity ?? 'info']}`}
                      >
                        {(finding.severity ?? 'info').toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground terminal-text">
                        {finding.stageName}
                      </span>
                    </div>
                    {finding.url && (
                      <p className="text-[10px] text-muted-foreground truncate mt-1 terminal-text">
                        {finding.url}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
