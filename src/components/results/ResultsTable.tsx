'use client';

import type { Subdomain, Endpoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Globe, Link, Code, Shield, Lock, Server, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  data: Subdomain[] | Endpoint[];
  type: 'subdomains' | 'endpoints';
}

const categoryColors: Record<string, string> = {
  api: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  js: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sensitive: 'bg-red-500/20 text-red-400 border-red-500/30',
  login: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  idor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  upload: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  parameter: 'bg-green-500/20 text-green-400 border-green-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function statusCodeColor(code: number | null): string {
  if (!code) return 'text-muted-foreground';
  if (code >= 200 && code < 300) return 'text-emerald-400';
  if (code >= 300 && code < 400) return 'text-blue-400';
  if (code >= 400 && code < 500) return 'text-amber-400';
  return 'text-red-400';
}

export function ResultsTable({ data, type }: ResultsTableProps) {
  const [selectedItem, setSelectedItem] = useState<Subdomain | Endpoint | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No results found. Try adjusting your filters.
      </div>
    );
  }

  if (type === 'subdomains') {
    const subdomains = data as Subdomain[];
    return (
      <>
        <ScrollArea className="max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Domain</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">IP</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Alive</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Server</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Title</th>
              </tr>
            </thead>
            <tbody>
              {subdomains.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer dark-table-row"
                  onClick={() => setSelectedItem(sub)}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="terminal-text text-foreground truncate max-w-48">
                        {sub.domain}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground terminal-text">{sub.ip || '-'}</td>
                  <td className="py-2 px-3">
                    <span className={statusCodeColor(sub.statusCode)}>
                      {sub.statusCode || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('status-dot', sub.alive ? 'status-dot-alive' : 'status-dot-dead')} />
                      <span className={sub.alive ? 'text-emerald-400' : 'text-muted-foreground'}>
                        {sub.alive ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground truncate max-w-32">{sub.webServer || '-'}</td>
                  <td className="py-2 px-3 text-muted-foreground truncate max-w-40">{sub.title || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        {/* Subdomain Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="bg-card border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400" />
                {(selectedItem as Subdomain)?.domain}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Subdomain details
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">IP Address</span>
                    <p className="terminal-text text-foreground">{(selectedItem as Subdomain).ip || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Status Code</span>
                    <p className={statusCodeColor((selectedItem as Subdomain).statusCode)}>
                      {(selectedItem as Subdomain).statusCode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Alive</span>
                    <p className={(selectedItem as Subdomain).alive ? 'text-emerald-400' : 'text-muted-foreground'}>
                      {(selectedItem as Subdomain).alive ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Web Server</span>
                    <p className="text-foreground">{(selectedItem as Subdomain).webServer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Title</span>
                    <p className="text-foreground">{(selectedItem as Subdomain).title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <p className="text-foreground">{(selectedItem as Subdomain).responseTime ? `${(selectedItem as Subdomain).responseTime}ms` : 'N/A'}</p>
                  </div>
                </div>
                {(selectedItem as Subdomain).technologies.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Technologies</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(selectedItem as Subdomain).technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(selectedItem as Subdomain).ports.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Open Ports</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(selectedItem as Subdomain).ports.map((port) => (
                        <Badge key={port} variant="outline" className="text-[10px] border-border text-foreground">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Endpoints table
  const endpoints = data as Endpoint[];
  return (
    <>
      <ScrollArea className="max-h-[500px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">URL</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Method</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Category</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Content Type</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => (
              <tr
                key={ep.id}
                className="border-b border-border/50 hover:bg-muted/20 cursor-pointer dark-table-row"
                onClick={() => setSelectedItem(ep)}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <Link className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="terminal-text text-foreground truncate max-w-64">
                      {ep.url}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-foreground">
                    {ep.method}
                  </Badge>
                </td>
                <td className="py-2 px-3">
                  <span className={statusCodeColor(ep.statusCode)}>
                    {ep.statusCode || '-'}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5 py-0 h-4', categoryColors[ep.category])}
                  >
                    {ep.category.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-muted-foreground truncate max-w-32">
                  {ep.contentType || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {/* Endpoint Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4 text-blue-400" />
              Endpoint Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Full endpoint information
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Full URL</span>
                <p className="terminal-text text-foreground break-all">{(selectedItem as Endpoint).url}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Method</span>
                  <p className="text-foreground">{(selectedItem as Endpoint).method}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status Code</span>
                  <p className={statusCodeColor((selectedItem as Endpoint).statusCode)}>
                    {(selectedItem as Endpoint).statusCode || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Category</span>
                  <Badge variant="outline" className={cn('text-[10px]', categoryColors[(selectedItem as Endpoint).category])}>
                    {(selectedItem as Endpoint).category.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Content Type</span>
                  <p className="text-foreground">{(selectedItem as Endpoint).contentType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Content Length</span>
                  <p className="text-foreground">{(selectedItem as Endpoint).contentLength ? `${(selectedItem as Endpoint).contentLength} bytes` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Subdomain</span>
                  <p className="terminal-text text-foreground">{(selectedItem as Endpoint).subdomain || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
