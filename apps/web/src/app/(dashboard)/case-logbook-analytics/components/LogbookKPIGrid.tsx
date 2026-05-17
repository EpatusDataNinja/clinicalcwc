'use client';

import React from 'react';
import {
  BookOpen,
  Activity,
  UserCheck,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import { useCases, useTasks } from '@/lib/hooks';

// Grid plan: 6 cards → grid-cols-2 md:grid-cols-3 xl:grid-cols-6
// All equal size — no orphans

export default function LogbookKPIGrid() {
  const cases = useCases();
  const tasks = useTasks();
  const active = cases.filter(
    (item) => item.status === 'active' || item.status === 'critical'
  ).length;
  const discharged = cases.filter((item) => item.status === 'discharged').length;
  const critical = cases.filter((item) => item.status === 'critical').length;
  const overdue = tasks.filter(
    (item) => !item.completed && new Date(item.dueAt).getTime() < Date.now()
  ).length;
  const avgTasks = cases.length > 0 ? (tasks.length / cases.length).toFixed(1) : '0.0';
  const now = new Date();
  const thisMonth = cases.filter((item) => {
    const created = new Date(item.createdAt);
    return (
      created.getUTCFullYear() === now.getUTCFullYear() &&
      created.getUTCMonth() === now.getUTCMonth()
    );
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        label="Total Cases Logged"
        value={cases.length}
        subtext="Stored locally"
        icon={BookOpen}
        variant="default"
        trend={{ value: `${thisMonth} this month`, direction: 'up' }}
        featured
      />
      <MetricCard
        label="Currently Active"
        value={active}
        subtext="Active or critical"
        icon={Activity}
        variant="default"
        trend={{ value: '+2 today', direction: 'up' }}
      />
      <MetricCard
        label="Discharged"
        value={discharged}
        subtext={`${cases.length > 0 ? Math.round((discharged / cases.length) * 100) : 0}% discharge rate`}
        icon={UserCheck}
        variant="positive"
        trend={{ value: '+4 this week', direction: 'up' }}
      />
      <MetricCard
        label="Critical Encounters"
        value={critical}
        subtext={`${cases.length > 0 ? Math.round((critical / cases.length) * 100) : 0}% of all cases`}
        icon={AlertTriangle}
        variant="critical"
        trend={{ value: '+1 this week', direction: 'up' }}
      />
      <MetricCard
        label="Avg Tasks / Case"
        value={avgTasks}
        subtext={`${overdue} tasks overdue now`}
        icon={ClipboardList}
        variant="warning"
        trend={{ value: '+0.4 vs last month', direction: 'up' }}
      />
      <MetricCard
        label="This Month"
        value={thisMonth}
        subtext={now.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        icon={TrendingUp}
        variant="default"
        trend={{ value: 'On pace for 74', direction: 'up' }}
      />
    </div>
  );
}
