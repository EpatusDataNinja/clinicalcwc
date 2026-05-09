import React from 'react';
import DashboardTopbar from './components/DashboardTopbar';
import KPIBentoGrid from './components/KPIBentoGrid';
import ActiveCaseTable from './components/ActiveCaseTable';
import TaskSidebar from './components/TaskSidebar';

export default function ClinicalCaseDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <DashboardTopbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-w-0">
          <KPIBentoGrid />
          <ActiveCaseTable />
        </div>
        <TaskSidebar />
      </div>
    </div>
  );
}