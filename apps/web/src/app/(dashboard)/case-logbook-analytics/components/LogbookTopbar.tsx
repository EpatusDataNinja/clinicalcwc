'use client';

import React, { useState } from 'react';
import { Download, Filter, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'All time', value: 'all' },
];

export default function LogbookTopbar() {
  const [range, setRange] = useState('3m');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    // BACKEND INTEGRATION POINT: GET /api/logbook/export?format=csv&range={range}
    await new Promise((r) => setTimeout(r, 1200));
    setExporting(false);
    toast?.success('Logbook exported', {
      description: 'clinical_logbook_2026.csv downloaded successfully',
    });
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Case Logbook & Analytics</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personal case log — Tengbain S. · A.M. Doglass College of Medicine
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Date Range */}
        <div className="hidden md:flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg p-1">
          <Calendar size={13} className="text-muted-foreground ml-1.5" />
          {DATE_RANGES?.map((r) => (
            <button
              key={`range-${r?.value}`}
              onClick={() => setRange(r?.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === r?.value
                  ? 'bg-card text-foreground shadow-card border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r?.label}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <Filter size={13} />
          <span className="hidden sm:block">Filter</span>
        </button>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-95"
        >
          <Download size={13} className={exporting ? 'animate-bounce' : ''} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}