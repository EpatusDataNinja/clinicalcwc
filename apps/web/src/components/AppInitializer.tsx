'use client';

import React, { useEffect } from 'react';
import { useAppInitialization } from '@/lib/hooks';
import { lockClinicalData } from '@/lib/clinicalDataService';
import { useCaseStore } from '@/lib/store';

const PASSCODE_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export default function AppInitializer() {
  const { error } = useAppInitialization();
  const authToken = useCaseStore((state) => state.authToken);
  const encryptionPasscode = useCaseStore((state) => state.encryptionPasscode);
  const isLocked = useCaseStore((state) => state.isLocked);

  useEffect(() => {
    if (error) {
      console.warn('App initialization error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (!authToken || !encryptionPasscode || isLocked) return;

    let idleTimer: number;

    const scheduleLock = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        lockClinicalData('inactivity');
      }, PASSCODE_IDLE_TIMEOUT_MS);
    };

    const lockOnSessionEnd = () => {
      lockClinicalData('tab_close');
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, scheduleLock, { passive: true });
    });
    window.addEventListener('pagehide', lockOnSessionEnd);
    window.addEventListener('beforeunload', lockOnSessionEnd);
    scheduleLock();

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, scheduleLock);
      });
      window.removeEventListener('pagehide', lockOnSessionEnd);
      window.removeEventListener('beforeunload', lockOnSessionEnd);
    };
  }, [authToken, encryptionPasscode, isLocked]);

  return null;
}
