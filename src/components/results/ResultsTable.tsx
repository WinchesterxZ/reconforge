'use client';

import type { Subdomain, Endpoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Globe,
  Link,
  Code,
  Shield,
  Lock,
  Server,
  ExternalLink,
  Check,
  X,
  Copy,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  data: Subdomain[] | Endpoint[];
  type: 'subdomains' | 'endpoints';
}

// ---- Color Maps ----

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/25',
  PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

function getMethodColor(method: string): string {
  return methodColors[method.toUpperCase()] || 'bg-gray-500/15 text-gray-400 border-gray-500/25';
}

const categoryColors: Record<string, string> = {
  interesting: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  backend: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
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

function getCategoryColor(category: string): string {
  return categoryColors[category.toLowerCase()] || categoryColors['other'];
}

function statusCodeBadgeStyle(code: number | null, isSoft404?: boolean): string {
  if (!code) return 'text-muted-foreground';
  if (isSoft404 && code >= 200 && code < 300) return 'bg-amber-500/15 text-amber-400';
  if (code >= 200 && code < 300) return 'bg-emerald-500/15 text-emerald-400';
  if (code >= 300 && code < 400) return 'bg-blue-500/15 text-blue-400';
  if (code >= 400 && code < 500) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
}

// ---- Content-Type Helpers ----

const contentTypeLabel: Record<string, string> = {
  'application/json': 'JSON',
  'text/html': 'HTML',
  'application/javascript': 'JS',
  'text/javascript': 'JS',
  'application/xml': 'XML',
  'text/xml': 'XML',
  'text/css': 'CSS',
  'text/plain': 'Plain',
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'application/octet-stream': 'Binary',
  'multipart/form-data': 'FormData',
  'application/x-www-form-urlencoded': 'FormUrl',
};

const contentTypeColor: Record<string, string> = {
  'application/json': 'bg-amber-500/15 text-amber-400',
  'text/html': 'bg-blue-500/15 text-blue-400',
  'application/javascript': 'bg-yellow-500/15 text-yellow-400',
  'text/javascript': 'bg-yellow-500/15 text-yellow-400',
  'application/xml': 'bg-orange-500/15 text-orange-400',
  'text/xml': 'bg-orange-500/15 text-orange-400',
  'text/css': 'bg-violet-500/15 text-violet-400',
  'text/plain': 'bg-gray-500/15 text-gray-400',
  'application/pdf': 'bg-red-500/15 text-red-400',
};

function formatContentType(ct: string | null): { label: string; color: string } {
  if (!ct) return { label: '-', color: '' };
  // Exact match first
  if (contentTypeLabel[ct]) {
    return { label: contentTypeLabel[ct], color: contentTypeColor[ct] || 'bg-gray-500/15 text-gray-400' };
  }
  // Fallback: extract main type
  const mainType = ct.split(';')[0].trim();
  const shortName = mainType.split('/').pop()?.toUpperCase().slice(0, 10) || mainType.slice(0, 10);
  return { label: shortName, color: 'bg-gray-500/15 text-gray-400' };
}

// ---- URL Parsing ----

function parseUrl(raw: string): { domain: string; path: string } {
  try {
    const u = new URL(raw);
    return {
      domain: u.hostname,
      path: u.pathname + u.search + u.hash,
    };
  } catch {
    // If it's not a full URL, just split on first /
    const idx = raw.indexOf('/');
    if (idx > 0) {
      return { domain: raw.slice(0, idx), path: raw.slice(idx) };
    }
    return { domain: raw, path: '' };
  }
}

// ---- Copy Button ----

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy URL
        </>
      )}
    </Button>
  );
}

// ---- Status Code Badge ----

function StatusCodeBadge({ code, isSoft404 }: { code: number | null; isSoft404?: boolean }) {
  if (!code) {
    return (
      <span className="text-muted-foreground text-xs">-</span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-medium min-w-[2rem] text-center',
            statusCodeBadgeStyle(code, isSoft404)
          )}
        >
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {isSoft404 && code >= 200 && code < 300 && 'Soft 404 - Server returned 200 but page is an error page'}
        {!isSoft404 && code >= 200 && code < 300 && 'Success'}
        {code >= 300 && code < 400 && 'Redirect'}
        {code >= 400 && code < 500 && 'Client Error'}
        {code >= 500 && 'Server Error'}
      </TooltipContent>
    </Tooltip>
  );
}

// ---- Main Component ----

export function ResultsTable({ data, type }: ResultsTableProps) {
  const [selectedItem, setSelectedItem] = useState<Subdomain | Endpoint | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No results found. Try adjusting your filters.
      </div>
    );
  }

  // ========================
  // Subdomains Table
  // ========================
  if (type === 'subdomains') {
    const subdomains = data as Subdomain[];
    return (
      <>
        <ScrollArea className="max-h-[600px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[30%]">Domain</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[14%]">IP</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[10%]">Status</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[8%]">Alive</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[18%]">Server</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Title</th>
              </tr>
            </thead>
            <tbody>
              {subdomains.map((sub) => (
                <tr
                  key={sub.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors',
                    sub.alive && 'border-l-2 border-l-emerald-500'
                  )}
                  onClick={() => setSelectedItem(sub)}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="terminal-text text-foreground truncate max-w-52 cursor-default">
                            {sub.domain}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs break-all">
                          {sub.domain}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="terminal-text text-muted-foreground text-[11px]">
                      {sub.ip || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <StatusCodeBadge code={sub.statusCode} />
                  </td>
                  <td className="py-2 px-3">
                    {sub.alive ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Alive</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <X className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Dead / Unreachable</TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground truncate max-w-36 block cursor-default">
                          {sub.webServer || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {sub.webServer || 'Unknown'}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="py-2 px-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground truncate max-w-40 block cursor-default">
                          {sub.title || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {sub.title || 'No title'}
                      </TooltipContent>
                    </Tooltip>
                  </td>
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
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Full Domain</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="terminal-text text-foreground break-all flex-1">
                      {(selectedItem as Subdomain).domain}
                    </p>
                    <CopyUrlButton url={(selectedItem as Subdomain).domain} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">IP Address</span>
                    <p className="terminal-text text-foreground mt-0.5">{(selectedItem as Subdomain).ip || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Status Code</span>
                    <div className="mt-0.5">
                      <StatusCodeBadge code={(selectedItem as Subdomain).statusCode} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Alive</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {(selectedItem as Subdomain).alive ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Alive</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Dead / Unreachable</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Web Server</span>
                    <p className="text-foreground mt-0.5">{(selectedItem as Subdomain).webServer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Title</span>
                    <p className="text-foreground mt-0.5">{(selectedItem as Subdomain).title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <p className="text-foreground mt-0.5">{(selectedItem as Subdomain).responseTime ? `${(selectedItem as Subdomain).responseTime}ms` : 'N/A'}</p>
                  </div>
                </div>
                {(selectedItem as Subdomain).technologies.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Technologies</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
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

  // ========================
  // Endpoints Table
  // ========================
  const endpoints = data as Endpoint[];
  return (
    <>
      <ScrollArea className="max-h-[600px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[40%]">URL</th>
              <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[10%]">Method</th>
              <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[8%]">Status</th>
              <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[15%]">Category</th>
              <th className="text-left py-2.5 px-3 text-muted-foreground font-medium w-[12%]">Content</th>
              <th className="text-right py-2.5 px-3 text-muted-foreground font-medium w-[15%]">Size</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => {
              const { domain, path } = parseUrl(ep.url);
              const ctInfo = formatContentType(ep.contentType);
              return (
                <tr
                  key={ep.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors',
                    ep.isSoft404 && 'opacity-70'
                  )}
                  onClick={() => setSelectedItem(ep)}
                >
                  {/* URL Column */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <Link className="h-3 w-3 text-blue-400 shrink-0" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate max-w-72 cursor-default">
                            <span className="terminal-text text-foreground">{domain}</span>
                            <span className="text-muted-foreground">{path}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-md break-all">
                          {ep.url}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>

                  {/* Method Column */}
                  <td className="py-2 px-3">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold min-w-[2.2rem] border',
                        getMethodColor(ep.method)
                      )}
                    >
                      {ep.method}
                    </span>
                  </td>

                  {/* Status Code Column */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <StatusCodeBadge code={ep.statusCode} isSoft404={ep.isSoft404} />
                      {ep.isSoft404 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="text-xs space-y-1">
                              <p className="font-medium text-amber-400">Soft 404 Detected</p>
                              <p className="text-muted-foreground">Server returned HTTP 200 but the response body contains error page patterns (e.g., Next.js __next_error__).</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>

                  {/* Category Column */}
                  <td className="py-2 px-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border cursor-default',
                            getCategoryColor(ep.category)
                          )}
                        >
                          {ep.category.toUpperCase()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Category: {ep.category}
                      </TooltipContent>
                    </Tooltip>
                  </td>

                  {/* Content-Type Column */}
                  <td className="py-2 px-3">
                    {ctInfo.label !== '-' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium cursor-default',
                              ctInfo.color
                            )}
                          >
                            {ctInfo.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {ep.contentType}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                  </td>

                  {/* Content Length Column */}
                  <td className="py-2 px-3 text-right">
                    {ep.contentLength != null ? (
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        {ep.contentLength > 1024
                          ? `${(ep.contentLength / 1024).toFixed(1)}KB`
                          : `${ep.contentLength}B`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
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
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Full URL</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="terminal-text text-foreground break-all flex-1">{(selectedItem as Endpoint).url}</p>
                  <CopyUrlButton url={(selectedItem as Endpoint).url} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Method</span>
                  <div className="mt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-bold min-w-[2.5rem] border',
                        getMethodColor((selectedItem as Endpoint).method)
                      )}
                    >
                      {(selectedItem as Endpoint).method}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status Code</span>
                  <div className="mt-0.5">
                  <StatusCodeBadge code={(selectedItem as Endpoint).statusCode} isSoft404={(selectedItem as Endpoint).isSoft404} />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Category</span>
                  <div className="mt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                        getCategoryColor((selectedItem as Endpoint).category)
                      )}
                    >
                      {(selectedItem as Endpoint).category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Content Type</span>
                  <p className="text-foreground mt-0.5 text-xs">{(selectedItem as Endpoint).contentType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Content Length</span>
                  <p className="text-foreground mt-0.5">
                    {(selectedItem as Endpoint).contentLength
                      ? `${(selectedItem as Endpoint).contentLength.toLocaleString()} bytes`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Subdomain</span>
                  <p className="terminal-text text-foreground mt-0.5">{(selectedItem as Endpoint).subdomain || 'N/A'}</p>
                </div>
              </div>

              {/* Soft 404 Warning */}
              {(selectedItem as Endpoint).isSoft404 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-sm font-medium text-amber-400">Soft 404 Detected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The server returned HTTP {(selectedItem as Endpoint).statusCode} (OK), but the response body contains error page patterns.
                    This endpoint likely does not exist — the server serves a custom 404 error page with a 200 status code.
                  </p>
                  {(selectedItem as Endpoint).responseBody && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Response Body Snippet</span>
                      <pre className="mt-1 p-2 rounded bg-muted/50 text-[10px] text-foreground overflow-x-auto max-h-24 terminal-text break-all">
                        {(selectedItem as Endpoint).responseBody}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
