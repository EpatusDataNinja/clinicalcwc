import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, UserX,  } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';

// Grid plan: 6 cards → grid-cols-3 xl:grid-cols-6
// Row 1: Active Cases (featured, spans 2 cols) + Critical Patients + Overdue Tasks
// Row 2: Discharged Today + Stable + Cases This Week
// Bento: 6 cards, 2 rows of 3 — no orphans

export default function KPIBentoGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Hero: Active Cases — spans 2 cols */}
      <div className="col-span-2">
        <MetricCard
          label="Active Cases"
          value={8}
          subtext="Across 6 wards — updated 2 min ago"
          icon={Activity}
          variant="default"
          trend={{ value: '+2 today', direction: 'up' }}
          featured
          className="h-full"
        />
      </div>

      {/* Critical Patients */}
      <MetricCard
        label="Critical Patients"
        value={2}
        subtext="ICU + CCU — immediate review needed"
        icon={AlertTriangle}
        variant="critical"
        trend={{ value: 'Same as yesterday', direction: 'neutral' }}
      />

      {/* Overdue Tasks */}
      <MetricCard
        label="Overdue Tasks"
        value={9}
        subtext="Across 5 cases — action required"
        icon={Clock}
        variant="warning"
        trend={{ value: '+3 since 12:00', direction: 'up' }}
      />

      {/* Discharged Today */}
      <MetricCard
        label="Discharged Today"
        value={1}
        subtext="G.Tetteh — Urology"
        icon={UserX}
        variant="muted"
        trend={{ value: '-1 vs yesterday', direction: 'down' }}
      />

      {/* Stable Cases */}
      <MetricCard
        label="Stable Cases"
        value={3}
        subtext="K.Owusu, F.Adjei, H.Quaye"
        icon={CheckCircle}
        variant="positive"
        trend={{ value: 'No change', direction: 'neutral' }}
      />
    </div>
  );
}