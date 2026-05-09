import React from 'react';
import type { CaseStatus, TaskPriority } from '@/lib/mockData';

interface StatusBadgeProps {
  status: CaseStatus;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusBadge({ status, size = 'md', pulse = false }: StatusBadgeProps) {
  const config: Record<CaseStatus, { label: string; classes: string; dotClass: string }> = {
    active: {
      label: 'Active',
      classes: 'bg-status-active border-status-active text-status-active',
      dotClass: 'bg-blue-400',
    },
    stable: {
      label: 'Stable',
      classes: 'bg-status-stable border-status-stable text-status-stable',
      dotClass: 'bg-emerald-400',
    },
    critical: {
      label: 'Critical',
      classes: 'bg-status-critical border-status-critical text-status-critical',
      dotClass: 'bg-red-400',
    },
    discharged: {
      label: 'Discharged',
      classes: 'bg-status-discharged border-status-discharged text-status-discharged',
      dotClass: 'bg-slate-400',
    },
  };

  const c = config[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses} ${c.classes}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dotClass} ${
          status === 'critical' && pulse ? 'animate-critical' : ''
        }`}
      />
      {c.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config: Record<TaskPriority, { label: string; classes: string }> = {
    high: {
      label: 'High',
      classes: 'bg-red-500/15 border-red-500/30 text-red-400',
    },
    medium: {
      label: 'Medium',
      classes: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    },
    low: {
      label: 'Low',
      classes: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    },
  };

  const c = config[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full border ${c.classes}`}
    >
      {c.label}
    </span>
  );
}