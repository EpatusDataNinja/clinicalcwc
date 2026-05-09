import React from 'react';
import CasesOverTimeChart from './CasesOverTimeChart';
import ConditionDistributionChart from './ConditionDistributionChart';
import TaskCompletionChart from './TaskCompletionChart';

export default function LogbookCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 gap-4">
      {/* Cases over time — spans 3 cols */}
      <div className="lg:col-span-3">
        <CasesOverTimeChart />
      </div>
      {/* Condition distribution — spans 2 cols */}
      <div className="lg:col-span-2 grid grid-rows-2 gap-4">
        <ConditionDistributionChart />
        <TaskCompletionChart />
      </div>
    </div>
  );
}