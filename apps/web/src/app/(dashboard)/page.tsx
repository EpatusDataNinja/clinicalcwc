'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Fix 8: Lazy-load heavy dashboard modules using next/dynamic
// These components contain tables, charts, and large data — don't block initial render

const DashboardTopbar = dynamic(() => import('./components/DashboardTopbar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0 h-14">
      <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-8 w-8 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-8 w-16 bg-primary/30 rounded-lg animate-pulse" />
      </div>
    </div>
  ),
});

const KPIBentoGrid = dynamic(() => import('./components/KPIBentoGrid'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={`kpi-skel-${i}`}
          className={`rounded-xl border border-border bg-card/50 p-4 h-28 animate-pulse ${i === 0 ? 'sm:col-span-2' : ''}`}
        >
          <div className="h-3 w-20 bg-muted/50 rounded mb-3" />
          <div className="h-6 w-12 bg-muted/50 rounded mb-2" />
          <div className="h-2 w-32 bg-muted/30 rounded" />
        </div>
      ))}
    </div>
  ),
});

const ActiveCaseTable = dynamic(() => import('./components/ActiveCaseTable'), {
  ssr: false,
  loading: () => (
    <div className="card-elevated overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
      </div>
      <div className="px-5 py-3 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={`row-skel-${i}`} className="flex items-center gap-4">
            <div className="h-4 w-4 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 flex-1 bg-muted/30 rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted/40 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  ),
});

const TaskSidebar = dynamic(() => import('./components/TaskSidebar'), {
  ssr: false,
  loading: () => (
    <aside className="w-72 xl:w-80 shrink-0 border-l border-border overflow-y-auto bg-card/30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
      </div>
      <div className="px-3 py-3 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={`task-skel-${i}`}
            className="p-2.5 rounded-lg border border-border/70 bg-muted/20 animate-pulse"
          >
            <div className="h-3 w-full bg-muted/50 rounded mb-2" />
            <div className="h-2 w-20 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    </aside>
  ),
});

export default function ClinicalCaseDashboardPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardTopbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Content: Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6 min-w-0">
          <KPIBentoGrid />
          <div className="pb-10">
            <ActiveCaseTable />
          </div>
        </div>

        {/* Task Sidebar: Hidden on small screens (mobile/tablets) */}
        <div className="hidden xl:block">
          <TaskSidebar />
        </div>
      </div>
    </div>
  );
}
