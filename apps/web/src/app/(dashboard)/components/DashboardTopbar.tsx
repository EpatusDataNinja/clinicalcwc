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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-foreground">Case Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active clinical cases — 5 May 2026, 16:35
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={13} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Sync Available</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <Wifi size={13} className="text-green-400" />
            <span className="text-xs font-medium text-green-400 hidden sm:block">Online</span>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases… (⌘K)"
              className="pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52 transition-all focus:w-64"
            />
          </div>

          {/* Sync button */}
          <button
            onClick={handleSync}
            className="p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Sync now"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Add Case */}
          <button
            onClick={() => setShowAddCase(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-md"
          >
            <Plus size={15} />
            <span className="hidden sm:block">New Case</span>
          </button>
        </div>
      </div>

      <AddCaseModal open={showAddCase} onClose={() => setShowAddCase(false)} />
    </>
  );
}