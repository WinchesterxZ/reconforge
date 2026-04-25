'use client';

import type { Vulnerability } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ShieldAlert,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VulnTableProps {
  vulnerabilities: Vulnerability[];
  onStatusChange: (id: string, status: string) => void;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const severityDotColors: Record<string, string> = {
  critical: 'status-dot status-dot-critical',
  high: 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.5)]',
  medium: 'status-dot status-dot-warning',
  low: 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]',
  info: 'bg-gray-400',
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3 w-3 text-amber-400" />,
  confirmed: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
  false_positive: <XCircle className="h-3 w-3 text-gray-400" />,
  fixed: <Wrench className="h-3 w-3 text-blue-400" />,
  accepted: <Eye className="h-3 w-3 text-purple-400" />,
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  confirmed: 'Confirmed',
  false_positive: 'False Positive',
  fixed: 'Fixed',
  accepted: 'Accepted',
};

export function VulnTable({ vulnerabilities, onStatusChange }: VulnTableProps) {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  return (
    <>
      <ScrollArea className="max-h-[500px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Title</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Severity</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">URL</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {vulnerabilities.map((vuln) => (
              <tr
                key={vuln.id}
                className="border-b border-border/50 hover:bg-muted/20 cursor-pointer dark-table-row"
                onClick={() => setSelectedVuln(vuln)}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', severityDotColors[vuln.severity])} />
                    <span className="text-foreground font-medium truncate max-w-48">
                      {vuln.title}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5 py-0 h-4', severityColors[vuln.severity])}
                  >
                    {vuln.severity.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-2 px-3">
                  <span className="terminal-text text-muted-foreground truncate block max-w-40">
                    {vuln.url}
                  </span>
                </td>
                <td className="py-2 px-3 text-muted-foreground">{vuln.type}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcons[vuln.status]}
                    <span className="text-muted-foreground">{statusLabels[vuln.status]}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-muted-foreground">
                  {new Date(vuln.discoveredAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {/* Vulnerability Detail Dialog */}
      <Dialog open={!!selectedVuln} onOpenChange={() => setSelectedVuln(null)}>
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              {selectedVuln?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Full vulnerability details
            </DialogDescription>
          </DialogHeader>

          {selectedVuln && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn('text-xs px-2 py-0.5', severityColors[selectedVuln.severity])}
                >
                  {selectedVuln.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 border-border text-foreground">
                  {selectedVuln.type}
                </Badge>
                {selectedVuln.cwe && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-border text-blue-400">
                    {selectedVuln.cwe}
                  </Badge>
                )}
                {selectedVuln.cvss && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-border text-amber-400">
                    CVSS: {selectedVuln.cvss}
                  </Badge>
                )}
              </div>

              {/* Status update */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={selectedVuln.status}
                  onValueChange={(val) => onStatusChange(selectedVuln.id, val)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="open" className="text-xs">Open</SelectItem>
                    <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                    <SelectItem value="false_positive" className="text-xs">False Positive</SelectItem>
                    <SelectItem value="fixed" className="text-xs">Fixed</SelectItem>
                    <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border" />

              {/* URL */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">URL</h4>
                <div className="flex items-center gap-2">
                  <code className="text-xs terminal-text text-foreground break-all bg-muted/50 px-2 py-1 rounded flex-1">
                    {selectedVuln.url}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => navigator.clipboard.writeText(selectedVuln.url)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedVuln.description}</p>
              </div>

              {/* Evidence */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Evidence</h4>
                <div className="bg-[#0a0a0f] border border-border rounded-md p-3">
                  <code className="text-xs terminal-text text-amber-400">{selectedVuln.evidence}</code>
                </div>
              </div>

              {/* Remediation */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Remediation</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedVuln.remediation}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Discovered</span>
                  <p className="text-foreground">{new Date(selectedVuln.discoveredAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated</span>
                  <p className="text-foreground">{new Date(selectedVuln.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
