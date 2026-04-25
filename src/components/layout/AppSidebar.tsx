'use client';

import { useAppStore } from '@/lib/store';
import type { AppView } from '@/lib/types';
import {
  LayoutDashboard,
  Target,
  Radar,
  Search,
  ShieldAlert,
  FileText,
  ChevronLeft,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { view: 'targets', label: 'Targets', icon: <Target className="h-5 w-5" /> },
  { view: 'scans', label: 'Scans', icon: <Radar className="h-5 w-5" /> },
  { view: 'results', label: 'Results', icon: <Search className="h-5 w-5" /> },
  { view: 'vulnerabilities', label: 'Vulns', icon: <ShieldAlert className="h-5 w-5" /> },
  { view: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" /> },
];

export function AppSidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-screen flex flex-col border-r border-border bg-sidebar transition-all duration-300 relative',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
            <Crosshair className="h-5 w-5 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-foreground">RECONFORGE</span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Bug Bounty</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const button = (
              <Button
                key={item.view}
                variant="ghost"
                onClick={() => setView(item.view)}
                className={cn(
                  'w-full justify-start gap-3 h-10 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary hover:bg-primary/20 glow-emerald'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.view}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        <Separator />

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
