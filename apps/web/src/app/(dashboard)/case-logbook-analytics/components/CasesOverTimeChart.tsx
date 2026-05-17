'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCases } from '@/lib/hooks';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated px-3 py-2.5 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={`tip-${p.name}`} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CasesOverTimeChart() {
  const cases = useCases();
  const casesOverTimeData = React.useMemo(() => {
    const buckets = new Map<string, { week: string; cases: number; critical: number }>();
    for (let index = 11; index >= 0; index--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - index * 7);
      const key = `${date.getUTCFullYear()}-W${Math.ceil(((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7)}`;
      buckets.set(key, { week: key.split('-')[1], cases: 0, critical: 0 });
    }
    for (const item of cases) {
      const date = new Date(item.createdAt);
      const key = `${date.getUTCFullYear()}-W${Math.ceil(((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.cases += 1;
        if (item.status === 'critical') bucket.critical += 1;
      }
    }
    return Array.from(buckets.values());
  }, [cases]);

  return (
    <div className="card-elevated p-5 h-full min-h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Cases Over Time</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Weekly case volume — last 12 weeks</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 h-0.5 bg-primary rounded inline-block" />
            Total cases
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 h-0.5 bg-red-400 rounded inline-block" />
            Critical
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={casesOverTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cases"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#gradCases)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="critical"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#gradCritical)"
            dot={false}
            activeDot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
