'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ResultsTable } from './ResultsTable';
import { ResultFilters } from './ResultFilters';
import type { Subdomain, Endpoint } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Globe, Link, Code, Shield, Lock, Key, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const tabs = [
  { key: 'all', label: 'All', icon: <Globe className="h-3.5 w-3.5" /> },
  { key: 'subdomains', label: 'Subdomains', icon: <Server className="h-3.5 w-3.5" /> },
  { key: 'endpoints', label: 'Endpoints', icon: <Link className="h-3.5 w-3.5" /> },
  { key: 'js', label: 'JS Files', icon: <Code className="h-3.5 w-3.5" /> },
  { key: 'api', label: 'APIs', icon: <Shield className="h-3.5 w-3.5" /> },
  { key: 'sensitive', label: 'Sensitive', icon: <Lock className="h-3.5 w-3.5" /> },
  { key: 'login', label: 'Login/Admin', icon: <Key className="h-3.5 w-3.5" /> },
  { key: 'idor', label: 'IDOR', icon: <Shield className="h-3.5 w-3.5" /> },
];

export function ResultsView() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusCode, setStatusCode] = useState('all');
  const [method, setMethod] = useState('all');
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [subRes, epRes] = await Promise.all([
        fetch('/api/subdomains'),
        fetch('/api/endpoints'),
      ]);
      
      if (subRes.ok) {
        const subData = await subRes.json();
        const mapped: Subdomain[] = (subData.subdomains || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          projectId: s.projectId as string,
          domain: s.domain as string,
          ip: s.ip as string || null,
          status: s.statusCode as number || null,
          alive: s.alive as boolean,
          webServer: s.webServer as string || null,
          title: s.title as string || null,
          technologies: [],
          ports: [],
          statusCode: s.statusCode as number || null,
          contentLength: s.contentLength as number || null,
          responseTime: null,
          discoveredAt: s.createdAt as string,
        }));
        setSubdomains(mapped);
      }

      if (epRes.ok) {
        const epData = await epRes.json();
        const mapped: Endpoint[] = (epData.endpoints || []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          projectId: e.projectId as string,
          url: e.url as string,
          method: e.method as string || 'GET',
          statusCode: e.statusCode as number || null,
          contentType: e.contentType as string || null,
          contentLength: e.contentLength as number || null,
          category: e.category as Endpoint['category'],
          subdomain: null,
          discoveredAt: e.createdAt as string,
        }));
        setEndpoints(mapped);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load results', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubdomains = useMemo(() => {
    let result = subdomains;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.domain.toLowerCase().includes(q) ||
          (s.ip && s.ip.includes(q)) ||
          (s.title && s.title.toLowerCase().includes(q))
      );
    }

    if (statusCode !== 'all') {
      const code = parseInt(statusCode);
      result = result.filter((s) => s.statusCode === code);
    }

    return result;
  }, [subdomains, search, statusCode]);

  const filteredEndpoints = useMemo(() => {
    let result = endpoints;

    if (activeTab === 'js') {
      result = result.filter((e) => e.category === 'js');
    } else if (activeTab === 'api') {
      result = result.filter((e) => e.category === 'api');
    } else if (activeTab === 'sensitive') {
      result = result.filter((e) => e.category === 'sensitive');
    } else if (activeTab === 'login') {
      result = result.filter((e) => e.category === 'login' || e.category === 'admin');
    } else if (activeTab === 'idor') {
      result = result.filter((e) => e.category === 'idor');
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.url.toLowerCase().includes(q));
    }

    if (category !== 'all') {
      result = result.filter((e) => e.category === category);
    }

    if (statusCode !== 'all') {
      const code = parseInt(statusCode);
      result = result.filter((e) => e.statusCode === code);
    }

    if (method !== 'all') {
      result = result.filter((e) => e.method === method);
    }

    return result;
  }, [endpoints, activeTab, search, category, statusCode, method]);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setStatusCode('all');
    setMethod('all');
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Generating export file...',
    });
  };

  const totalCount =
    activeTab === 'subdomains'
      ? filteredSubdomains.length
      : activeTab === 'all'
        ? filteredSubdomains.length + filteredEndpoints.length
        : filteredEndpoints.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Results Explorer</h2>
          <p className="text-sm text-muted-foreground">
            Browse discovered subdomains, endpoints, and assets
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="border-border text-foreground hover:bg-accent gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="text-xs gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 space-y-4">
          {/* Filters */}
          <ResultFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            statusCode={statusCode}
            onStatusCodeChange={setStatusCode}
            method={method}
            onMethodChange={setMethod}
            onClear={clearFilters}
            activeTab={activeTab}
          />

          {/* Results count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {totalCount.toLocaleString()} results
            </span>
          </div>

          {/* Results Table */}
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              {(activeTab === 'all' || activeTab === 'subdomains') && filteredSubdomains.length > 0 && activeTab !== 'js' && activeTab !== 'api' && activeTab !== 'sensitive' && activeTab !== 'login' && activeTab !== 'idor' && (
                <div>
                  {activeTab === 'all' && (
                    <div className="px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Subdomains ({filteredSubdomains.length})
                    </div>
                  )}
                  <ResultsTable data={filteredSubdomains} type="subdomains" />
                </div>
              )}

              {(activeTab !== 'subdomains') && filteredEndpoints.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <div className="px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
                      Endpoints ({filteredEndpoints.length})
                    </div>
                  )}
                  <ResultsTable data={filteredEndpoints} type="endpoints" />
                </div>
              )}

              {totalCount === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No results found matching your filters.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
