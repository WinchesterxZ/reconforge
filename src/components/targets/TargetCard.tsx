'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import {
  Globe,
  Link,
  ShieldAlert,
  Trash2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TargetCardProps {
  project: Project;
  index: number;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function TargetCard({ project, index, onDelete }: TargetCardProps) {
  const { setView, selectProject } = useAppStore();

  const handleClick = () => {
    selectProject(project.id);
    setView('scans');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card
        className="border-border bg-card hover:border-primary/30 hover:glow-emerald transition-all cursor-pointer group"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {project.name}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${statusColors[project.status]}`}
                >
                  {project.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Domains */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.domains.slice(0, 3).map((domain) => (
              <Badge
                key={domain}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 font-mono bg-muted text-muted-foreground"
              >
                {domain}
              </Badge>
            ))}
            {project.domains.length > 3 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground"
              >
                +{project.domains.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3 w-3 text-emerald-400" />
              <span className="text-muted-foreground">{project.subdomainCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Link className="h-3 w-3 text-blue-400" />
              <span className="text-muted-foreground">{project.endpointCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <ShieldAlert className="h-3 w-3 text-red-400" />
              <span className="text-muted-foreground">{project.vulnerabilityCount}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {project.lastScanDate
                ? new Date(project.lastScanDate).toLocaleDateString()
                : 'Never scanned'}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
