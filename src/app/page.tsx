'use client';

import { useAppStore } from '@/lib/store';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TargetsView } from '@/components/targets/TargetsView';
import { ScansView } from '@/components/scans/ScansView';
import { ResultsView } from '@/components/results/ResultsView';
import { VulnsView } from '@/components/vulnerabilities/VulnsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function ViewRenderer() {
  const { currentView } = useAppStore();

  const views: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    targets: <TargetsView />,
    scans: <ScansView />,
    results: <ResultsView />,
    vulnerabilities: <VulnsView />,
    reports: <ReportsView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {views[currentView] || <DashboardView />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ViewRenderer />
        </main>
      </div>
    </div>
  );
}
