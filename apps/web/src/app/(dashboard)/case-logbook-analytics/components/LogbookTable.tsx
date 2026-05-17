'use client';

import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, Download, SlidersHorizontal } from 'lucide-react';
import { type ClinicalCase, type CaseStatus } from '@/lib/mockData';
import { useCases } from '@/lib/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

type SortField = 'patientAlias' | 'chiefComplaint' | 'status' | 'createdAt' | 'taskCount';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES: (CaseStatus | 'all')[] = ['all', 'active', 'critical', 'stable', 'discharged'];

function getDuration(createdAt: string, updatedAt: string): string {
  const start = new Date(createdAt);
  const end = new Date(updatedAt);
  const diffMs = end.getTime() - start.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffD >= 1) return `${diffD}d`;
  if (diffH >= 1) return `${diffH}h`;
  return '<1h';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LogbookTable() {
  const cases = useCases();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.patientAlias.toLowerCase().includes(q) ||
      c.chiefComplaint.toLowerCase().includes(q) ||
      c.impression.toLowerCase().includes(q) ||
      (c.ward ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    else if (sortField === 'taskCount') cmp = a.taskCount - b.taskCount;
    else cmp = (a[sortField] as string).localeCompare(b[sortField] as string);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={10} className="inline ml-1 opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="inline ml-1 text-primary" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-primary" />
    );
  };

  return (
    <div className="card-elevated overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Full Case Logbook</h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {filtered.length} entries
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search alias, complaint, impression…"
              className="pl-8 pr-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52 transition-all focus:w-64"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            {ALL_STATUSES.map((s) => (
              <button
                key={`logbook-filter-${s}`}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                Case ID
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('patientAlias')}
              >
                Patient <SortIcon field="patientAlias" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('chiefComplaint')}
              >
                Chief Complaint <SortIcon field="chiefComplaint" />
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
                onClick={() => toggleSort('createdAt')}
              >
                Created <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon={BookOpen}
                    title="No cases match your search"
                    description="Try adjusting the search query or status filter to find what you're looking for."
                    action={{
                      label: 'Clear Search',
                      onClick: () => {
                        setSearch('');
                        setStatusFilter('all');
                      },
                    }}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((c) => <LogbookRow key={c.id} caseItem={c} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            Showing {sorted.length === 0 ? 0 : (page - 1) * perPage + 1}–
            {Math.min(page * perPage, sorted.length)} of {sorted.length}
          </span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-input border border-border rounded text-xs text-foreground px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {[5, 8, 10, 20, 50].map((n) => (
              <option key={`per-page-${n}`} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={`logbook-page-${pageNum}`}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogbookRow({ caseItem: c }: { caseItem: ClinicalCase }) {
  function getDuration(createdAt: string, updatedAt: string): string {
    const start = new Date(createdAt);
    const end = new Date(updatedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffD >= 1) return `${diffD}d`;
    if (diffH >= 1) return `${diffH}h`;
    return '<1h';
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <tr className="group hover:bg-muted/25 transition-colors duration-150">
      <td className="px-5 py-3">
        <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{c.patientAlias}</p>
        <p className="text-xs text-muted-foreground">{c.ageGroup}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground max-w-[160px] truncate" title={c.chiefComplaint}>
          {c.chiefComplaint}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-muted-foreground max-w-[180px] truncate" title={c.impression}>
          {c.impression}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={c.status} pulse={c.status === 'critical'} />
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded font-medium">
          {c.ward}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm tabular-nums text-foreground">{c.taskCount}</span>
          {c.overdueTaskCount > 0 && (
            <span className="text-xs text-red-400 font-semibold">({c.overdueTaskCount}↑)</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {formatDate(c.createdAt)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {getDuration(c.createdAt, c.updatedAt)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="View full case notes"
            className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all active:scale-95"
          >
            <Eye size={13} />
          </button>
          <button
            title="Export this case as PDF"
            className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all active:scale-95"
          >
            <Download size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
