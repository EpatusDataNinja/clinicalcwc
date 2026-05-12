import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, UserX,  } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import { useCases, useTasks } from '@/lib/hooks';

// Grid plan: 6 cards → grid-cols-3 xl:grid-cols-6
// Row 1: Active Cases (featured, spans 2 cols) + Critical Patients + Overdue Tasks
// Row 2: Discharged Today + Stable + Cases This Week
// Bento: 6 cards, 2 rows of 3 — no orphans

export default function KPIBentoGrid() {
  const cases = useCases();
  const tasks = useTasks();

  const activeCount = cases.filter(c => c.status === 'active' || c.status === 'critical').length;
  const criticalCount = cases.filter(c => c.status === 'critical').length;
  const stableCount = cases.filter(c => c.status === 'stable').length;
  const dischargedTodayCount = cases.filter(c => {
    if (c.status !== 'discharged') return false;
    const updatedAt = new Date(c.updatedAt);
    const today = new Date();
    return updatedAt.toDateString() === today.toDateString();
  }).length;

  const now = new Date();
  const overdueTasksCount = tasks.filter(t => !t.completed && new Date(t.dueAt) < now).length;
  const overdueCasesCount = cases.filter(c => c.overdueTaskCount > 0).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Hero: Active Cases — spans 2 cols on tablet/desktop */}
      <div className="sm:col-span-2">
        <MetricCard
          label="Active Cases"
          value={activeCount}
          subtext={`Across ${new Set(cases.map(c => c.ward)).size} wards — Live updates`}
          icon={Activity}
          variant="default"
          featured
          className="h-full"
        />
      </div>

      {/* Critical Patients */}
      <MetricCard
        label="Critical Patients"
        value={criticalCount}
        subtext="Immediate review needed"
        icon={AlertTriangle}
        variant="critical"
      />

      {/* Overdue Tasks */}
      <MetricCard
        label="Overdue Tasks"
        value={overdueTasksCount}
        subtext={`Across ${overdueCasesCount} cases — action required`}
        icon={Clock}
        variant="warning"
      />

      {/* Discharged Today */}
      <MetricCard
        label="Discharged Today"
        value={dischargedTodayCount}
        subtext="Completed since 00:00"
        icon={UserX}
        variant="muted"
      />

      {/* Stable Cases */}
      <MetricCard
        label="Stable Cases"
        value={stableCount}
        subtext="Monitoring status"
        icon={CheckCircle}
        variant="positive"
      />
    </div>
  );
}