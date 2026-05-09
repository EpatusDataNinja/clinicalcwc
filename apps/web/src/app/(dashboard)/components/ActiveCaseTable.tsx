'use client';

import React, { useState } from 'react';
import { Eye, Edit2, Trash2, ChevronUp, ChevronDown, Filter, AlertCircle, CheckSquare,  } from 'lucide-react';
import { mockCases, type ClinicalCase, type CaseStatus } from '@/lib/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/AppIcon';


type SortField = 'patientAlias' | 'chiefComplaint' | 'status' | 'updatedAt' | 'taskCount';
type SortDir = 'asc' | 'desc';

const STATUS_FILTERS: { label: string; value: CaseStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Critical', value: 'critical' },
  { label: 'Stable', value: 'stable' },
  { label: 'Discharged', value: 'discharged' },
];

export default function ActiveCaseTable() {
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 7;

  const filtered = mockCases.filter(
    (c) => statusFilter === 'all' || c.status === statusFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'updatedAt') {
      cmp = a.updatedAt.localeCompare(b.updatedAt);
    } else if (sortField === 'taskCount') {
      cmp = a.taskCount - b.taskCount;
    } else {
      cmp = (a[sortField] as string).localeCompare(b[sortField] as string);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === paginated.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginated.map((c) => c.id)));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return (
        <span className="ml-1 opacity-30 text-xs">
          <ChevronUp size={10} className="inline" />
        </span>
      );
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="inline ml-1 text-primary" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-primary" />
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date('2026-05-05T16:35:00Z');
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor(diffMs / 60000);
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  return (
    <div className="card-elevated overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Active Case List</h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {filtered.length} cases
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter chips */}
          <div className="hidden md:flex items-center gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={`filter-${f.value}`}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Filter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 border-b border-primary/20 animate-slide-up">
          <span className="text-xs font-semibold text-primary">
            {selectedRows.size} selected
          </span>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/60">
            Update Status
          </button>
          <button className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10">
            Archive Selected
          </button>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-border bg-input accent-primary"
                  checked={selectedRows.size === paginated.length && paginated.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('patientAlias')}
              >
                Patient <SortIcon field="patientAlias" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chief Complaint
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Impression
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ward
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('taskCount')}
              >
                Tasks <SortIcon field="taskCount" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('updatedAt')}
              >
                Updated <SortIcon field="updatedAt" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon={CheckSquare}
                    title="No cases match this filter"
                    description="Try selecting a different status filter or create a new case."
                    action={{ label: 'Clear Filter', onClick: () => setStatusFilter('all') }}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <CaseRow
                  key={c.id}
                  caseItem={c}
                  selected={selectedRows.has(c.id)}
                  onToggle={() => toggleRow(c.id)}
                  formatTime={formatTime}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground tabular-nums">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of{' '}
            {sorted.length} cases
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={`page-${i + 1}`}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({
  caseItem: c,
  selected,
  onToggle,
  formatTime,
}: {
  caseItem: ClinicalCase;
  selected: boolean;
  onToggle: () => void;
  formatTime: (iso: string) => string;
}) {
  const isCritical = c.status === 'critical';
  const hasOverdue = c.overdueTaskCount > 0;

  return (
    <tr
      className={`group transition-colors duration-150 ${
        selected ? 'bg-primary/8' : 'hover:bg-muted/30'
      } ${isCritical ? 'bg-red-500/5' : ''}`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          className="rounded border-border bg-input accent-primary"
          checked={selected}
          onChange={onToggle}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isCritical && (
            <AlertCircle size={13} className="text-red-400 animate-critical shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{c.patientAlias}</p>
            <p className="text-xs text-muted-foreground font-mono">{c.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground max-w-[180px] truncate" title={c.chiefComplaint}>
          {c.chiefComplaint}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-muted-foreground max-w-[180px] truncate" title={c.impression}>
          {c.impression}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={c.status} pulse={isCritical} />
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded font-medium">
          {c.ward}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm tabular-nums text-foreground">{c.taskCount}</span>
          {hasOverdue && (
            <span className="text-xs text-red-400 font-semibold">
              ({c.overdueTaskCount} overdue)
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {formatTime(c.updatedAt)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={Eye} label="View case details" />
          <ActionButton icon={Edit2} label="Edit case" />
          <ActionButton icon={Trash2} label="Delete case — cannot be undone" danger />
        </div>
      </td>
    </tr>
  );
}

function ActionButton({
  icon: Icon,
  label,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      className={`group/btn relative p-1.5 rounded-lg transition-all duration-150 active:scale-95 ${
        danger
          ? 'hover:bg-red-500/15 text-muted-foreground hover:text-red-400'
          : 'hover:bg-primary/15 text-muted-foreground hover:text-primary'
      }`}
    >
      <Icon size={13} />
    </button>
  );
}