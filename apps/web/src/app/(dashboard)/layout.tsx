'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useCaseStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const authToken = useCaseStore((state) => state.authToken);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Guard: Redirect to login if no token
  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
    }
  }, [authToken, router]);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!authToken) {
    return null; // Prevent flicker while redirecting
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full border-r border-border">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-64 h-full animate-slide-right shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isMobile onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-[#0D1526] shrink-0">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">ClinicalCWC</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted/20 text-muted-foreground transition-colors"
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
