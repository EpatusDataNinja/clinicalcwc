'use client';

import React, { useEffect } from 'react';
import { useAppInitialization } from '@/lib/hooks';

export default function AppInitializer() {
  const { isLoading, error } = useAppInitialization();

  useEffect(() => {
    if (error) {
      console.error('App initialization error:', error);
    }
  }, [error]);

  return null;
}
