import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-muted/60 rounded-md ${className}`} />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-16 h-8 mb-2" />
      <Skeleton className="w-24 h-3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-col-${i}`} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-20' : i === cols - 1 ? 'w-16' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}