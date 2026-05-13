'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { useCaseStore, type CaseStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Loader2, LayoutDashboard } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import AppInitializer from '@/components/AppInitializer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Hardened Audit: Use decoupled status
  const authToken = useCaseStore((state: CaseStore) => state.authToken);
  const authStatus = useCaseStore((state: CaseStore) => state.authStatus);
  const dataStatus = useCaseStore((state: CaseStore) => state.dataStatus);
  const initError = useCaseStore((state: CaseStore) => state.initError);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Guard (Decoupled from Data)
  useEffect(() => {
    // Only redirect if auth hydration is complete and we still have no token
    if (authStatus === 'ready' && !authToken) {
      router.replace('/login');
    }
  }, [authStatus, authToken, router]);

  // Safer close handler
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Prevent flash during initial hydration
  if (['idle', 'hydrating'].includes(authStatus) || (!authToken && pathname !== '/login')) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] overflow-hidden bg-background">
      {/* Fix 2: AppInitializer moved here from root layout */}
      <AppInitializer />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full border-r border-border">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] lg:hidden"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeMobileMenu}
          />
          {/* Content */}
          <div 
            className="absolute top-0 left-0 w-72 h-full bg-[#0D1526] shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isMobile onMobileClose={closeMobileMenu} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-[#0D1526] shrink-0">
          <div className="flex items-center gap-2">
            <AppLogo size={24} />
            <span className="font-bold text-sm text-foreground tracking-tight">ClinicalCWC</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted/20 text-muted-foreground transition-colors active:scale-95"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {dataStatus === 'error' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <LayoutDashboard size={32} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Workspace Initialization Failed</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {initError || 'There was a problem loading your clinical workspace. Please try refreshing the page.'}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Retry Initialization
              </button>
            </div>
          ) : dataStatus !== 'ready' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Initializing clinical workspace...</p>
                <p className="text-xs text-muted-foreground mt-1 animate-pulse capitalize">
                  Current Stage: {dataStatus}
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
