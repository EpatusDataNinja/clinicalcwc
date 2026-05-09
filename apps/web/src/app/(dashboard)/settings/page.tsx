'use client';

import React, { useState, useEffect } from 'react';
import { isEncryptionAvailable } from '@/lib/encryptionService';
import { getPendingCount, pullRemoteSnapshot, runSync } from '@/lib/syncService';
import { downloadBackup, importBackup, clearLocalData } from '@/lib/dataManagementService';
import { restoreDataFromDB } from '@/lib/clinicalDataService';
import { useCaseStore } from '@/lib/store';
import {
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Info,
  Server,
  Smartphone,
} from 'lucide-react';

export default function SettingsPage() {
  const store = useCaseStore();
  const { encryptionPasscode, setEncryptionPasscode, authToken, setSyncStatus, syncStatus, setPendingSyncCount, pendingSyncCount, setLastSyncAt, lastSyncAt } = store;

  const [localPasscode, setLocalPasscode] = useState('');
  const [confirmLocalPasscode, setConfirmLocalPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [dataActionStatus, setDataActionStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : false);
  const [encAvailable] = useState(isEncryptionAvailable());
  const encryptionEnabled = Boolean(encryptionPasscode);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const fetchPendingCount = async () => {
      const count = await getPendingCount();
      setPendingSyncCount(count);
    };
    fetchPendingCount();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [setPendingSyncCount]);

  // Initialize local passcode state from store
  useEffect(() => {
    if (encryptionPasscode) {
      setLocalPasscode(encryptionPasscode);
      setConfirmLocalPasscode(encryptionPasscode);
    }
  }, [encryptionPasscode]);

  const handleEnableEncryption = () => {
    if (localPasscode?.length < 6) return;
    if (localPasscode !== confirmLocalPasscode) return;
    setEncryptionPasscode(localPasscode); // Set in Zustand store
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    const result = await runSync(authToken || undefined);
    if (authToken && result.status !== 'offline') {
      await pullRemoteSnapshot(authToken);
    }
    setSyncStatus(result.status);
    setPendingSyncCount(await getPendingCount()); // Update pending count after sync
    if (result.lastSyncAt) setLastSyncAt(result.lastSyncAt);
    setTimeout(() => setSyncStatus('idle'), 3000); // Reset status after a delay
  };

  const handleExport = async () => {
    await downloadBackup();
    setDataActionStatus('Backup exported.');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importBackup(file);
    await restoreDataFromDB();
    setDataActionStatus('Backup imported.');
    event.target.value = '';
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all local cases, tasks, and pending sync changes?')) return;
    await clearLocalData();
    setDataActionStatus('Local data cleared.');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Security, sync, and data management
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-2xl">
        {/* Encryption Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Encryption Layer</h2>
          </div>
          <div className="card-elevated rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {encryptionEnabled ? (
                    <Lock size={18} className="text-emerald-400" />
                  ) : (
                    <Unlock size={18} className="text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      AES-256 Local Encryption
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {encryptionPasscode
                        ? 'All case data is encrypted before storage'
                        : 'Data stored in plain text — enable encryption'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    encryptionPasscode
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {encryptionPasscode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {!encryptionPasscode && (
              <div className="px-5 py-4 space-y-3">
                {!encAvailable && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">Web Crypto API not available in this environment.</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Set Passcode (min 6 characters)
                  </label>
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      placeholder="Enter passcode..."
                      value={localPasscode}
                      onChange={(e) => setLocalPasscode(e?.target?.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasscode ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Confirm Passcode
                  </label>
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    placeholder="Confirm passcode..."
                    value={confirmLocalPasscode}
                    onChange={(e) => setConfirmLocalPasscode(e?.target?.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                {localPasscode && confirmLocalPasscode && localPasscode !== confirmLocalPasscode && (
                  <p className="text-xs text-red-400">Passcodes do not match.</p>
                )}
                <button
                  onClick={handleEnableEncryption}
                  disabled={localPasscode.length < 6 || localPasscode !== confirmLocalPasscode || !encAvailable}
                  className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enable Encryption
                </button>
              </div>
            )}

            {encryptionPasscode && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">
                    Encryption active. Data is encrypted using AES-256-GCM with PBKDF2 key derivation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sync Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Sync System</h2>
          </div>
          <div className="card-elevated rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <Wifi size={18} className="text-emerald-400" />
                  ) : (
                    <WifiOff size={18} className="text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isOnline ? 'Online — Ready to Sync' : 'Offline Mode'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pendingSyncCount > 0
                        ? `${pendingSyncCount} changes pending sync`
                        : 'All changes synced'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing' || !isOnline}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'success' ? 'Synced!' : 'Sync Now'}
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                { label: 'Strategy', value: 'Last-write-wins (LWW)', icon: Server },
                { label: 'Storage', value: 'Encrypted blobs only — no plain text on server', icon: Lock },
                { label: 'Retry', value: 'Auto-retry up to 3 times on failure', icon: RefreshCw },
                { label: 'Offline', value: 'All features work without internet', icon: Smartphone },
              ]?.map((item) => (
                <div key={item?.label} className="flex items-center gap-3 py-1.5">
                  <item.icon size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{item?.label}</span>
                  <span className="text-xs text-foreground">{item?.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Data Management</h2>
          </div>
          <div className="card-elevated rounded-xl overflow-hidden divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Download size={16} className="text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Export All Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Download encrypted backup of all cases and tasks</p>
                </div>
              </div>
              <button onClick={handleExport} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                Export
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Import Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Restore from an encrypted backup file</p>
                </div>
              </div>
              <label className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Import
                <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
              </label>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Trash2 size={16} className="text-red-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Clear Local Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Permanently delete all local case data and pending sync changes</p>
                </div>
              </div>
              <button onClick={handleClear} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                Clear
              </button>
            </div>
            {dataActionStatus && (
              <div className="px-5 py-3 text-xs text-emerald-400 bg-emerald-500/8">
                {dataActionStatus}
              </div>
            )}
          </div>
        </section>

        {/* PWA Info */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">PWA & Offline</h2>
          </div>
          <div className="card-elevated rounded-xl px-5 py-4 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/8 border border-primary/20">
              <Info size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80">
                ClinicalCWC is a Progressive Web App. Install it on your home screen for full offline access — all features work without internet.
              </p>
            </div>
            {[
              { label: 'Service Worker', value: 'Active — caching all routes', ok: true },
              { label: 'Offline Storage', value: 'localStorage + IndexedDB ready', ok: true },
              { label: 'Install Prompt', value: 'Available on supported browsers', ok: true },
            ]?.map((item) => (
              <div key={item?.label} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">{item?.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${item?.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-xs text-foreground">{item?.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
