'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCaseStore } from '@/lib/store';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, BookOpen, Pill, CheckSquare, Settings, ChevronLeft, ChevronRight, Wifi, WifiOff, User, LogOut, Activity, X } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeVariant?: 'default' | 'critical' | 'warning';
}

const navItems: NavItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Case Dashboard',
    href: '/',
    icon: LayoutDashboard,
    badge: 3,
    badgeVariant: 'critical',
  },
  {
    id: 'nav-tracker',
    label: 'Case Tracker',
    href: '/active-case-tracker',
    icon: Activity,
    badge: 2,
    badgeVariant: 'critical',
  },
  {
    id: 'nav-logbook',
    label: 'Case Logbook',
    href: '/case-logbook-analytics',
    icon: BookOpen,
  },
  {
    id: 'nav-tasks',
    label: 'Task Manager',
    href: '/task-management',
    icon: CheckSquare,
    badge: 5,
    badgeVariant: 'warning',
  },
  {
    id: 'nav-drugs',
    label: 'Drug Reference',
    href: '/drug-reference',
    icon: Pill,
  },
];

const bottomItems: NavItem[] = [
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobile, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline] = useState(true);

  const isActive = (href: string, id: string) => {
    if (id === 'nav-dashboard') return pathname === '/';
    return pathname === href;
  };

  const getBadgeClasses = (variant?: string) => {
    if (variant === 'critical') return 'bg-red-500/90 text-white';
    if (variant === 'warning') return 'bg-amber-500/90 text-white';
    return 'bg-primary/90 text-white';
  };

  const actualCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={`relative flex flex-col h-full border-r border-border transition-all duration-300 ease-in-out shrink-0 ${isMobile ? 'w-full' : ''}`}
      style={{
        width: isMobile ? '100%' : actualCollapsed ? '64px' : '240px',
        background: 'linear-gradient(180deg, #0D1526 0%, #0B1120 100%)',
      }}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-border overflow-hidden shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AppLogo size={32} />
          {!actualCollapsed && (
            <div className="min-w-0 overflow-hidden">
              <span className="block font-semibold text-sm text-foreground tracking-tight leading-none truncate">
                ClinicalCWC
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                Workflow Companion
              </span>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-muted/20 text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sync Status */}
      <div
        className={`flex items-center gap-2 mx-3 mt-3 mb-1 px-2 py-1.5 rounded-md transition-all shrink-0 ${isOnline
            ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'
          }`}
      >
        {isOnline ? (
          <Wifi size={14} className="text-green-400 shrink-0" />
        ) : (
          <WifiOff size={14} className="text-amber-400 shrink-0" />
        )}
        {!actualCollapsed && (
          <span
            className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-amber-400'
              }`}
          >
            {isOnline ? 'Synced' : 'Offline Mode'}
          </span>
        )}
      </div>

      {/* Nav Group */}
      <nav className="flex-1 px-2 pt-2 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <div className={`mb-1 ${actualCollapsed ? 'hidden' : 'block'}`}>
          <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Clinical
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.id);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={actualCollapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/5' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              {!actualCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!actualCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${getBadgeClasses(item.badgeVariant)}`}
                >
                  {item.badge}
                </span>
              )}
              {actualCollapsed && item.badge !== undefined && (
                <span
                  className={`absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full leading-none ${getBadgeClasses(item.badgeVariant)}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className={`mt-4 mb-1 ${actualCollapsed ? 'hidden' : 'block'}`}>
          <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            System
          </span>
        </div>

        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.id);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={actualCollapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/5' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              {!actualCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border mt-auto shrink-0 overflow-hidden">
        <Link href="/profile" className="flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden text-primary">
            <User size={16} />
          </div>
          {!actualCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {useCaseStore((state) => state.userName) || 'Clinical Intern'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {useCaseStore((state) => state.userEmail) || 'user@example.com'}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 z-10 shadow-card"
        >
          {actualCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}
    </aside>
  );
}