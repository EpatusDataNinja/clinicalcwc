'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { unlockClinicalData } from '@/lib/clinicalDataService';
import { useCaseStore } from '@/lib/store';
import { logout } from '@/lib/authService';

export default function ClinicalLockScreen() {
  const initError = useCaseStore((state) => state.initError);
  const lockReason = useCaseStore((state) => state.lockReason);
  const failureCount = useCaseStore((state) => state.decryptionFailureCount);
  const [passcode, setPasscode] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passcode || unlocking) return;

    setUnlocking(true);
    setLocalError(null);

    try {
      const unlocked = await unlockClinicalData(passcode);
      if (!unlocked) {
        setLocalError('Incorrect passcode. Please try again.');
        setPasscode('');
      }
    } catch {
      setLocalError('Unable to unlock this workspace with that passcode.');
      setPasscode('');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSignOut = async () => {
    if (
      confirm(
        'Sign out and lock this workspace? You will need to sign in again to access your data.'
      )
    ) {
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-6 py-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LockKeyhole size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Clinical Workspace Locked</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Re-enter your encryption passcode to decrypt local clinical data.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-3">
          <ShieldCheck size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Protected cases and tasks are hidden while locked. Your encrypted records remain stored
            locally on this device.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Encryption Passcode
            </label>
            <input
              type="password"
              value={passcode}
              autoComplete="current-password"
              onChange={(event) => setPasscode(event.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Enter passcode"
              autoFocus
            />
          </div>

          {(localError || initError) && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-3">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-red-300">{localError || initError}</p>
                {failureCount > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Failed attempts: {failureCount}/3
                  </p>
                )}
              </div>
            </div>
          )}

          {lockReason === 'inactivity' && (
            <p className="text-xs text-muted-foreground">
              This session locked automatically after 15 minutes of inactivity.
            </p>
          )}

          <button
            type="submit"
            disabled={!passcode || unlocking}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {unlocking ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
            Unlock Workspace
          </button>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Sign out to use a different account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
