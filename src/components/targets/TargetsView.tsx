'use client';

import { useState, useEffect, useCallback } from 'react';
import { TargetCard } from './TargetCard';
import { AddTargetDialog } from './AddTargetDialog';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ApiProject {
  id: string;
  name: string;
  domains: string;
  headers: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    subdomains: number;
    endpoints: number;
    vulnerabilities: number;
    scans: number;
  };
}

function mapApiProject(apiProject: ApiProject): Project {
  let customHeaders: Record<string, string> = {};
  try {
    customHeaders = JSON.parse(apiProject.headers || '{}');
  } catch { /* empty */ }

  return {
    id: apiProject.id,
    name: apiProject.name,
    domains: apiProject.domains ? apiProject.domains.split(',').map((d: string) => d.trim()).filter(Boolean) : [],
    description: apiProject.description || '',
    customHeaders,
    status: (apiProject.status === 'archived' ? 'paused' : apiProject.status) as Project['status'],
    subdomainCount: apiProject._count?.subdomains || 0,
    endpointCount: apiProject._count?.endpoints || 0,
    vulnerabilityCount: apiProject._count?.vulnerabilities || 0,
    lastScanDate: null,
    createdAt: apiProject.createdAt,
    updatedAt: apiProject.updatedAt,
  };
}

export function TargetsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      const mapped = (data.projects || []).map(mapApiProject);
      setProjects(mapped);
    } catch {
      toast({ title: 'Error', description: 'Failed to load targets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddTarget = async (data: {
    name: string;
    domains: string[];
    description: string;
    customHeaders: Record<string, string>;
  }) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          domains: data.domains.join(','),
          description: data.description,
          headers: JSON.stringify(data.customHeaders),
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      toast({
        title: 'Target Added',
        description: `${data.name} has been added with ${data.domains.length} domain(s).`,
      });
      fetchProjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to create target', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      toast({
        title: 'Target Deleted',
        description: `${project?.name || 'Target'} has been removed.`,
      });
      fetchProjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete target', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Targets</h2>
          <p className="text-sm text-muted-foreground">
            Manage your bug bounty targets and scope
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Target
        </Button>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground mb-4">
            <Plus className="h-12 w-12 mx-auto opacity-30" />
          </div>
          <p className="text-muted-foreground">No targets yet. Add your first target to get started.</p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-4 border-primary text-primary hover:bg-primary/10 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Target
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <TargetCard
              key={project.id}
              project={project}
              index={i}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Target Dialog */}
      <AddTargetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddTarget}
      />
    </div>
  );
}
