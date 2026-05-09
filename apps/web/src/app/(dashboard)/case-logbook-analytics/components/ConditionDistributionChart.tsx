'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useCases } from '@/lib/hooks';

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { fill: string; condition: string };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{d.payload.condition}</p>
      <p className="text-muted-foreground mt-0.5">
        <span className="font-bold text-foreground tabular-nums">{d.value}</span> cases
      </p>
    </div>
  );
};

export default function ConditionDistributionChart() {
  const cases = useCases();
  const palette = ['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981', '#F97316', '#64748B'];
  const conditionDistributionData = Object.entries(
    cases.reduce<Record<string, number>>((acc, item) => {
      const condition = item.impression.split(/[—-]/)[0].trim() || 'Other';
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {})
  ).map(([condition, count], index) => ({
    condition,
    count,
    fill: palette[index % palette.length],
  }));

  return (
    <div className="card-elevated p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Condition Distribution</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Cases by clinical category</p>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          data={conditionDistributionData}
          margin={{ top: 2, right: 4, left: -28, bottom: 0 }}
          barSize={14}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="condition"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={28}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {conditionDistributionData.map((entry) => (
              <Cell key={`cell-cond-${entry.condition}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
