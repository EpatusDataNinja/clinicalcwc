'use client';

import React, { useState } from 'react';
import { CheckSquare, Clock, AlertCircle, Check, ChevronRight } from 'lucide-react';
import { mockTasks, type ClinicalTask } from '@/lib/mockData';
import { PriorityBadge } from '@/components/ui/StatusBadge';

export default function TaskSidebar() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(['task-004']));

  const now = new Date('2026-05-05T16:35:00Z');

  const overdue = mockTasks.filter((t) => {
    const due = new Date(t.dueAt);
    return !completedIds.has(t.id) && due < now;
  });

  const upcoming = mockTasks.filter((t) => {
    const due = new Date(t.dueAt);
    return !completedIds.has(t.id) && due >= now;
  });

  const done = mockTasks.filter((t) => completedIds.has(t.id));

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDue = (iso: string) => {
    const d = new Date(iso);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 border-l border-border overflow-y-auto bg-card/30 flex flex-col hidden lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CheckSquare size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Today's Tasks</h2>
        </div>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {overdue.length + upcoming.length} pending
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Overdue */}
        {overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Overdue ({overdue.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {overdue.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isOverdue
                  onToggle={() => toggleComplete(t.id)}
                  formatDue={formatDue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming ({upcoming.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {upcoming.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isOverdue={false}
                  onToggle={() => toggleComplete(t.id)}
                  formatDue={formatDue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Check size={12} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Completed ({done.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {done.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isOverdue={false}
                  completed
                  onToggle={() => toggleComplete(t.id)}
                  formatDue={formatDue}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          View All Tasks
          <ChevronRight size={12} />
        </button>
      </div>
    </aside>
  );
}

function TaskCard({
  task,
  isOverdue,
  completed = false,
  onToggle,
  formatDue,
}: {
  task: ClinicalTask;
  isOverdue: boolean;
  completed?: boolean;
  onToggle: () => void;
  formatDue: (iso: string) => string;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-150 ${
        completed
          ? 'border-border/50 bg-muted/20 opacity-60'
          : isOverdue
          ? 'border-red-500/25 bg-red-500/5 hover:bg-red-500/10' :'border-border/70 bg-muted/20 hover:bg-muted/40'
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-150 active:scale-95 ${
          completed
            ? 'bg-emerald-500 border-emerald-500 text-white' :'border-border hover:border-primary bg-transparent'
        }`}
      >
        {completed && <Check size={10} />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium leading-snug ${
            completed ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-mono">{task.patientAlias}</span>
          <span
            className={`text-xs font-mono tabular-nums ${
              isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground'
            }`}
          >
            {formatDue(task.dueAt)}
          </span>
        </div>
        <div className="mt-1">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
    </div>
  );
}