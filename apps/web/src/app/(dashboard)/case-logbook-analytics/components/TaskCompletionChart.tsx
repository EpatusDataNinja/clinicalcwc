'use client';

import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTasks } from '@/lib/hooks';

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">
        {payload[0].name}: <span className="tabular-nums">{payload[0].value}%</span>
      </p>
    </div>
  );
};

export default function TaskCompletionChart() {
  const tasks = useTasks();
  const completed = tasks.filter((task) => task.completed).length;
  const pending = Math.max(tasks.length - completed, 0);
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const overdue = tasks.filter((task) => !task.completed && new Date(task.dueAt).getTime() < Date.now()).length;
  const completionData = [
    { name: 'Completed', value: completionRate, fill: '#10B981' },
    { name: 'Pending', value: Math.max(100 - completionRate, 0), fill: 'var(--border)' },
  ];

  return (
    <div className="card-elevated p-4 flex items-center gap-4">
      <div className="shrink-0">
        <ResponsiveContainer width={90} height={90}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="90%"
            data={completionData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'var(--muted)' }} />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-2xl font-bold text-emerald-400 tabular-nums">{completionRate}%</p>
        <p className="text-xs font-semibold text-foreground mt-0.5">Task Completion</p>
        <p className="text-xs text-muted-foreground mt-1">
          {completed} of {tasks.length} tasks completed
        </p>
        <p className="text-xs text-amber-400 mt-1 font-medium">{overdue} currently overdue</p>
      </div>
    </div>
  );
}
