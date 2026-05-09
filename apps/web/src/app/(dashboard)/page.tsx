import React from 'react';
import DashboardTopbar from './components/DashboardTopbar';
import KPIBentoGrid from './components/KPIBentoGrid';
import ActiveCaseTable from './components/ActiveCaseTable';
import TaskSidebar from './components/TaskSidebar';

export default function ClinicalCaseDashboardPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardTopbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Content: Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-6 min-w-0">
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