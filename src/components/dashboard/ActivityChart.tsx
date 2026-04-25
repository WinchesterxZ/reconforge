'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getActivityChartData } from '@/lib/api';
import { motion } from 'framer-motion';

export function ActivityChart() {
  const data = getActivityChartData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
    >
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Discovery Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubdomains" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEndpoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVulns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.005 270)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
                  axisLine={{ stroke: 'oklch(0.2 0.005 270)' }}
                  tickLine={{ stroke: 'oklch(0.2 0.005 270)' }}
                />
                <YAxis
                  tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
                  axisLine={{ stroke: 'oklch(0.2 0.005 270)' }}
                  tickLine={{ stroke: 'oklch(0.2 0.005 270)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.1 0.005 270)',
                    border: '1px solid oklch(0.2 0.005 270)',
                    borderRadius: '8px',
                    color: 'oklch(0.95 0 0)',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: 'oklch(0.7 0 0)', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="subdomains"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorSubdomains)"
                  strokeWidth={2}
                  name="Subdomains"
                />
                <Area
                  type="monotone"
                  dataKey="endpoints"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorEndpoints)"
                  strokeWidth={2}
                  name="Endpoints"
                />
                <Area
                  type="monotone"
                  dataKey="vulnerabilities"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorVulns)"
                  strokeWidth={2}
                  name="Vulnerabilities"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
