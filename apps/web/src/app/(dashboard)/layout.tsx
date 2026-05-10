'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { useCaseStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import AppInitializer from '@/components/AppInitializer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Fix 9: Use selector instead of subscribing to entire store
  const authToken = useCaseStore((state) => state.authToken);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
    }
  }, [authToken, router]);

  // Safer close handler
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  if (!authToken) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          {children}
        </main>
      </div>
    </div>
  );
}
