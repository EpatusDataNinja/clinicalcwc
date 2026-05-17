import React from 'react';
import LogbookTopbar from './components/LogbookTopbar';
import LogbookKPIGrid from './components/LogbookKPIGrid';
import LogbookCharts from './components/LogbookCharts';
import LogbookTable from './components/LogbookTable';

export default function CaseLogbookAnalyticsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <LogbookTopbar />
      <div className="flex-1 px-6 py-5 space-y-5 max-w-screen-2xl w-full mx-auto">
        <LogbookKPIGrid />
        <LogbookCharts />
        <LogbookTable />
      </div>
    </div>
  );
}
