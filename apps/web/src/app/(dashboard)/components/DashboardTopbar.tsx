'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, RefreshCw, Wifi, AlertTriangle } from 'lucide-react';
import AddCaseModal from './AddCaseModal';
import { useCaseStore } from '@/lib/store';
import { runSync, pullRemoteSnapshot } from '@/lib/syncService';
import { toast } from 'sonner';

export default function DashboardTopbar() {
  const [showAddCase, setShowAddCase] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const authToken = useCaseStore((state) => state.authToken);

  const handleSync = async () => {
    if (!authToken) {
      toast.error('Please sign in to sync your data');
      return;
    }

    setSyncing(true);
    try {
      await runSync(authToken);
      await pullRemoteSnapshot(authToken);
      toast.success('Sync completed', {
        description: 'All your clinical cases are up to date.',
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed', {
        description: 'Check your connection and try again.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate hidden sm:block">
            Dashboard
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
            Active clinical cases — Real-time
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* Sync Status - Hidden on small mobile */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tight">Sync Needed</span>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <Wifi size={12} className="text-green-400" />
            <span className="text-[10px] font-bold text-green-400 hidden lg:block uppercase tracking-tight">Live</span>
          </div>

          {/* Search - Hidden on mobile */}
          <div className="relative hidden xl:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSync}
              className="p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all active:scale-90"
              title="Sync now"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            </button>

            <button className="p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all active:scale-90 relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            <button
              onClick={() => setShowAddCase(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden sm:block">New</span>
            </button>
          </div>
        </div>
      </div>

      <AddCaseModal open={showAddCase} onClose={() => setShowAddCase(false)} />
    </>
  );
}