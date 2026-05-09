import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'positive' | 'muted';
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  className?: string;
  featured?: boolean;
}

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trend,
  className = '',
  featured = false,
}: MetricCardProps) {
  const variantConfig = {
    default: {
      card: 'border-border',
      icon: 'bg-primary/10 text-primary',
      value: 'text-foreground',
      glow: '',
    },
    critical: {
      card: 'border-red-500/30 glow-critical',
      icon: 'bg-red-500/15 text-red-400',
      value: 'text-red-400',
      glow: 'glow-critical',
    },
    warning: {
      card: 'border-amber-500/30',
      icon: 'bg-amber-500/15 text-amber-400',
      value: 'text-amber-400',
      glow: '',
    },
    positive: {
      card: 'border-emerald-500/30',
      icon: 'bg-emerald-500/15 text-emerald-400',
      value: 'text-emerald-400',
      glow: '',
    },
    muted: {
      card: 'border-border',
      icon: 'bg-muted text-muted-foreground',
      value: 'text-muted-foreground',
      glow: '',
    },
  };

  const vc = variantConfig[variant];

  return (
    <div
      className={`card-elevated p-4 ${vc.card} ${vc.glow} transition-all duration-200 hover:border-primary/30 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${vc.icon}`}>
          <Icon size={featured ? 20 : 16} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up' ?'text-emerald-400'
                : trend.direction === 'down' ?'text-red-400' :'text-muted-foreground'
            }`}
          >
            <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <div>
        <p
          className={`tabular-nums font-bold ${featured ? 'text-4xl' : 'text-2xl'} ${vc.value} leading-none`}
        >
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-1.5 tracking-wide uppercase">
          {label}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}