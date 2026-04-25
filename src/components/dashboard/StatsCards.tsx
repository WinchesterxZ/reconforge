'use client';

import { Target, Globe, ShieldAlert, Radar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '@/lib/types';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: DashboardStats;
}

const statCards = [
  {
    key: 'totalTargets' as const,
    label: 'Total Targets',
    icon: Target,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
  },
  {
    key: 'subdomainsFound' as const,
    label: 'Subdomains Found',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    key: 'vulnerabilities' as const,
    label: 'Vulnerabilities',
    icon: ShieldAlert,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/20',
  },
  {
    key: 'activeScans' as const,
    label: 'Active Scans',
    icon: Radar,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className={`border ${card.borderColor} bg-card hover:bg-card/80 transition-colors`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </span>
                    <span className={`text-2xl font-bold ${card.color} terminal-text`}>
                      {value.toLocaleString()}
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
