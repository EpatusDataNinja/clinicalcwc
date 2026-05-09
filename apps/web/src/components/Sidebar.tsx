'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCaseStore } from '@/lib/store';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, BookOpen, Pill, CheckSquare, Settings, ChevronLeft, ChevronRight, Wifi, WifiOff, User, LogOut, Activity } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';



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

export default function Sidebar() {
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

  return (
    <aside
      className="relative flex flex-col border-r border-border transition-all duration-300 ease-in-out shrink-0"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'linear-gradient(180deg, #0D1526 0%, #0B1120 100%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-border overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <AppLogo size={32} />
          {!collapsed && (
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
      </div>

      {/* Sync Status */}
      <div
        className={`flex items-center gap-2 mx-3 mt-3 mb-1 px-2 py-1.5 rounded-md transition-all ${
          isOnline
            ? 'bg-green-500/10 border border-green-500/20' :'bg-amber-500/10 border border-amber-500/20'
        }`}
      >
        {isOnline ? (
          <Wifi size={14} className="text-green-400 shrink-0" />
        ) : (
          <WifiOff size={14} className="text-amber-400 shrink-0" />
        )}
        {!collapsed && (
          <span
            className={`text-xs font-medium ${
              isOnline ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {isOnline ? 'Synced' : 'Offline Mode'}
          </span>
        )}
      </div>

      {/* Nav Group */}
      <nav className="flex-1 px-2 pt-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <div className={`mb-1 ${collapsed ? 'hidden' : 'block'}`}>
          <span className="px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
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
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/20' :'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none ${getBadgeClasses(item.badgeVariant)}`}
                >
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && (
                <span
                  className={`absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full leading-none ${getBadgeClasses(item.badgeVariant)}`}
                >
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-secondary border border-border text-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-elevated">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        <div className={`mt-4 mb-1 ${collapsed ? 'hidden' : 'block'}`}>
          <span className="px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
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
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/20' :'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-secondary border border-border text-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-elevated">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <Link href="/profile" className="border-t border-border p-3 hover:bg-muted/30 transition-colors block cursor-pointer">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden text-primary">
            <User size={16} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {useCaseStore((state) => state.userName) || 'Clinical Intern'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {useCaseStore((state) => state.userEmail) || 'Offline Mode'}
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="p-1 rounded text-muted-foreground">
              <Settings size={14} />
            </div>
          )}
        </div>
      </Link>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 z-10 shadow-card"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}