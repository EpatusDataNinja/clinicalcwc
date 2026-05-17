'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isEncryptionAvailable } from '@/lib/encryptionService';
import { getPendingCount, runSync } from '@/lib/syncService';
import {
  downloadBackup,
  importBackup,
  clearLocalData,
  resetClinicalWorkspace,
} from '@/lib/dataManagementService';
import { rotateEncryptionPasscode } from '@/lib/clinicalDataService';
import { useCaseStore } from '@/lib/store';
import { telemetry } from '@/lib/telemetryService';
import Modal from '@/components/ui/Modal';
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
  ShieldAlert,
  Info,
  Server,
  Smartphone,
} from 'lucide-react';

export default function SettingsPage() {
  // Fix 9: Use individual selectors instead of subscribing to entire store
  const encryptionPasscode = useCaseStore((s) => s.encryptionPasscode);
  const setEncryptionPasscode = useCaseStore((s) => s.setEncryptionPasscode);
  const authToken = useCaseStore((s) => s.authToken);
  const setSyncStatus = useCaseStore((s) => s.setSyncStatus);
  const syncStatus = useCaseStore((s) => s.syncStatus);
  const setPendingSyncCount = useCaseStore((s) => s.setPendingSyncCount);
  const pendingSyncCount = useCaseStore((s) => s.pendingSyncCount);
  const setLastSyncAt = useCaseStore((s) => s.setLastSyncAt);
  const lastSyncAt = useCaseStore((s) => s.lastSyncAt);

  const router = useRouter();
  const [localPasscode, setLocalPasscode] = useState('');
  const [confirmLocalPasscode, setConfirmLocalPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [dataActionStatus, setDataActionStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : false
  );
  const [encAvailable] = useState(isEncryptionAvailable());
  const encryptionEnabled = Boolean(encryptionPasscode);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<'demo_only' | 'full'>('demo_only');
  const [wipeCredentials, setWipeCredentials] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleRotatePasscode = async () => {
    if (localPasscode.length < 6 || localPasscode !== confirmLocalPasscode) return;
    if (!encryptionPasscode) return;

    setIsRotating(true);
    try {
      await rotateEncryptionPasscode(encryptionPasscode, localPasscode);
      setDataActionStatus('Passcode updated and data re-encrypted.');
      setIsEditingPasscode(false);
    } catch (err) {
      setDataActionStatus(err instanceof Error ? err.message : 'Rotation failed.');
    } finally {
      setIsRotating(false);
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    const result = await runSync(authToken || undefined);
    setSyncStatus(result.status);
    setPendingSyncCount(await getPendingCount()); // Update pending count after sync
    if (result.lastSyncAt) setLastSyncAt(result.lastSyncAt);
    setTimeout(() => setSyncStatus('idle'), 3000); // Reset status after a delay
  };

  const handleExport = async () => {
    await downloadBackup();
    setDataActionStatus('Backup exported.');
  };

  const handleTelemetryExport = async () => {
    const logs = await telemetry.getLogs(1000);
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinicalcwc-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataActionStatus('Telemetry exported.');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      // importBackup() now self-hydrates — no separate restoreDataFromDB needed
      await importBackup(file);
      setDataActionStatus('Backup imported.');
      event.target.value = '';
    } catch (error) {
      setDataActionStatus(error instanceof Error ? error.message : 'Backup import failed.');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all local cases, tasks, and pending sync changes?')) return;
    await clearLocalData();
    setDataActionStatus('Local data cleared.');
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetClinicalWorkspace(resetMode, wipeCredentials);
      toast.success(
        'Workspace successfully reset. You can now begin with a fresh clinical environment.'
      );
      setShowResetModal(false);
      if (wipeCredentials) {
        router.push('/login');
      } else {
        router.push('/');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reset failed');
    } finally {
      setIsResetting(false);
    }
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
                    <p className="text-sm font-medium text-foreground">AES-256 Local Encryption</p>
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
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {encryptionPasscode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {(!encryptionPasscode || isEditingPasscode) && (
              <div className="px-5 py-4 space-y-3">
                {!encAvailable && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">
                      Web Crypto API not available in this environment.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Set Passcode (min 6 characters)
                  </label>
                  <div className="relative">
                    <Key
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
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
                {localPasscode &&
                  confirmLocalPasscode &&
                  localPasscode !== confirmLocalPasscode && (
                    <p className="text-xs text-red-400">Passcodes do not match.</p>
                  )}
                <button
                  onClick={encryptionPasscode ? handleRotatePasscode : handleEnableEncryption}
                  disabled={
                    localPasscode.length < 6 ||
                    localPasscode !== confirmLocalPasscode ||
                    !encAvailable ||
                    isRotating
                  }
                  className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {encryptionPasscode
                    ? isRotating
                      ? 'Updating...'
                      : 'Update Passcode'
                    : 'Enable Encryption'}
                </button>
              </div>
            )}

            {encryptionPasscode && !isEditingPasscode && (
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">
                    Encryption active. Data is encrypted using AES-256-GCM with PBKDF2 key
                    derivation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLocalPasscode('');
                    setConfirmLocalPasscode('');
                    setIsEditingPasscode(true);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Update Encryption Passcode
                </button>
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
                  {syncStatus === 'syncing'
                    ? 'Syncing...'
                    : syncStatus === 'success'
                      ? 'Synced!'
                      : 'Sync Now'}
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                { label: 'Strategy', value: 'Last-write-wins (LWW)', icon: Server },
                {
                  label: 'Storage',
                  value: 'Encrypted blobs only — no plain text on server',
                  icon: Lock,
                },
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
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download encrypted backup of all cases and tasks
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Import Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Restore from an encrypted backup file
                  </p>
                </div>
              </div>
              <label className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Import
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Export Telemetry Logs</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download local security, sync, and initialization events
                  </p>
                </div>
              </div>
              <button
                onClick={handleTelemetryExport}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Trash2 size={16} className="text-red-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Clear Local Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete all local case data and pending sync changes
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Start Fresh Workspace (Reset Demo Data)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently reset your workspace or wipe demo data to start fresh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                Reset
              </button>
            </div>
            {dataActionStatus && (
              <div className="px-5 py-3 text-xs text-emerald-400 bg-emerald-500/8">
                {dataActionStatus}
              </div>
            )}
          </div>
        </section>

        {/* Clinical Safety Disclaimer */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Clinical Safety</h2>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-amber-500">Disclaimer:</strong> ClinicalCWC is a workflow
              management tool designed to assist healthcare professionals with clinical tracking and
              task organization. It is
              <strong> not</strong> a medical device and should not be used for diagnosis, treatment
              decisions, or as a replacement for institutional Electronic Medical Records (EMR).
            </p>
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
                ClinicalCWC is a Progressive Web App. Install it on your home screen for full
                offline access — all features work without internet.
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
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${item?.ok ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  />
                  <span className="text-xs text-foreground">{item?.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Start Fresh Workspace Confirmation Modal */}
      <Modal
        open={showResetModal}
        onClose={() => !isResetting && setShowResetModal(false)}
        title="Start Fresh Workspace"
        size="md"
      >
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Warning:</strong> This will permanently remove all demo/sample cases, tasks,
              and logs from your local workspace. Your encrypted data will not be affected unless
              explicitly selected.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Reset Mode
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setResetMode('demo_only')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  resetMode === 'demo_only'
                    ? 'border-primary bg-primary/5 text-foreground font-semibold'
                    : 'border-border bg-card/40 text-muted-foreground hover:bg-card/80 font-medium'
                }`}
              >
                <div className="pt-0.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      resetMode === 'demo_only' ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    {resetMode === 'demo_only' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-foreground">
                    Reset Demo Data Only (Recommended)
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Deletes seeded/sample cases, tasks, and logs only. Preserves user-created data.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResetMode('full')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  resetMode === 'full'
                    ? 'border-red-500/50 bg-red-500/5 text-foreground font-semibold'
                    : 'border-border bg-card/40 text-muted-foreground hover:bg-card/80 font-medium'
                }`}
              >
                <div className="pt-0.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      resetMode === 'full' ? 'border-red-500' : 'border-muted'
                    }`}
                  >
                    {resetMode === 'full' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-foreground text-red-400">
                    Full Workspace Reset (Advanced)
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Deletes ALL local IndexedDB clinical data, clears Zustand cache, and
                    reinitializes database schema only (no seed data).
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="flex items-center gap-2.5 p-2 rounded hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={wipeCredentials}
                onChange={(e) => setWipeCredentials(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary shrink-0 w-3.5 h-3.5 bg-background"
              />
              <div className="text-left">
                <span className="block text-xs font-medium text-foreground">
                  Wipe authentication & cloud sync credentials
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Removes login session and local sync configuration. Recommended for multi-user
                  device handovers.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              disabled={isResetting}
              onClick={() => setShowResetModal(false)}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isResetting}
              onClick={handleConfirmReset}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                resetMode === 'full'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isResetting && <RefreshCw className="w-3 h-3 animate-spin" />}
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
