'use client';

import React, { useState } from 'react';
import { useTasks, useCases } from '@/lib/hooks';
import type { ClinicalTask, TaskPriority } from '@/lib/mockData';
import {
  createTask,
  deleteTask as deletePersistedTask,
  updateTask,
} from '@/lib/clinicalDataService';
import { PriorityBadge } from '@/components/ui/StatusBadge';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  ChevronDown,
  Trash2,
  Link2,
  CheckCircle2,
  Circle,
  ListTodo,
} from 'lucide-react';

type FilterTab = 'all' | 'pending' | 'overdue' | 'completed';
type PriorityFilter = 'all' | TaskPriority;

const PRIORITY_FILTERS: { label: string; value: PriorityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All Tasks', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Completed', value: 'completed' },
];

export default function TaskManagementPage() {
  const baseTasks = useTasks();
  const cases = useCases();
  const now = new Date();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [caseFilter, setCaseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    caseId: '',
    priority: 'medium' as TaskPriority,
    dueAt: '',
  });

  const tasks = baseTasks.map((t) => ({
    ...t,
    isOverdue: !t.completed && new Date(t.dueAt) < now,
  }));

  const filtered = tasks.filter((t) => {
    const matchTab =
      filterTab === 'all' ||
      (filterTab === 'pending' && !t.completed && !t.isOverdue) ||
      (filterTab === 'overdue' && t.isOverdue) ||
      (filterTab === 'completed' && t.completed);
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchCase = caseFilter === 'all' || t.caseId === caseFilter;
    const matchSearch =
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.patientAlias.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchPriority && matchCase && matchSearch;
  });

  const toggleTask = async (task: ClinicalTask) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  const deleteTask = async (id: string) => {
    await deletePersistedTask(id);
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.caseId) return;
    const caseItem = cases.find((c) => c.id === newTask.caseId);
    if (!caseItem) return;
    await createTask({
      caseId: newTask.caseId,
      patientAlias: caseItem.patientAlias,
      title: newTask.title.trim(),
      completed: false,
      dueAt: newTask.dueAt ? new Date(newTask.dueAt).toISOString() : '',
      priority: newTask.priority,
    });
    setNewTask({ title: '', caseId: '', priority: 'medium', dueAt: '' });
    setShowAddModal(false);
  };

  const formatDue = (iso: string) => {
    const d = new Date(iso);
    const diff = d.getTime() - now.getTime();
    const h = Math.floor(Math.abs(diff) / 3600000);
    const m = Math.floor(Math.abs(diff) / 60000);
    if (diff < 0) {
      if (m < 60) return `${m}m overdue`;
      if (h < 24) return `${h}h overdue`;
      return `${Math.floor(h / 24)}d overdue`;
    }
    if (m < 60) return `in ${m}m`;
    if (h < 24) return `in ${h}h`;
    return `in ${Math.floor(h / 24)}d`;
  };

  const pendingCount = tasks.filter((t) => !t.completed && !t.isOverdue).length;
  const overdueCount = tasks.filter((t) => t.isOverdue).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Task Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track clinical tasks linked to patient cases
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Add Task
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border shrink-0">
        {[
          {
            label: 'Pending',
            value: pendingCount,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            icon: Circle,
          },
          {
            label: 'Overdue',
            value: overdueCount,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/20',
            icon: AlertTriangle,
          },
          {
            label: 'Completed',
            value: completedCount,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            icon: CheckCircle2,
          },
          {
            label: 'Completion Rate',
            value: `${completionRate}%`,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
            icon: ListTodo,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${kpi.bg}`}
          >
            <kpi.icon size={18} className={kpi.color} />
            <div>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0 flex-wrap">
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterTab === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.value === 'overdue' && overdueCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/80 text-white text-xs leading-none">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriorityFilter(p.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                priorityFilter === p.value
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-border bg-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="all">All Patients</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.patientAlias}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} tasks
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No tasks match your filters</p>
            <button
              onClick={() => {
                setFilterTab('all');
                setPriorityFilter('all');
                setCaseFilter('all');
                setSearch('');
              }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task)}
              onDelete={() => deleteTask(task.id)}
              formatDue={formatDue}
            />
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 card-elevated rounded-2xl shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">New Task</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Repeat ECG in 30 minutes"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Linked Patient *
                </label>
                <select
                  value={newTask.caseId}
                  onChange={(e) => setNewTask({ ...newTask, caseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">Select patient...</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.patientAlias} — {c.chiefComplaint.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value as TaskPriority })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.dueAt}
                    onChange={(e) => setNewTask({ ...newTask, dueAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTask.title.trim() || !newTask.caseId}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: ClinicalTask & { isOverdue: boolean };
  onToggle: () => void;
  onDelete: () => void;
  formatDue: (iso: string) => string;
}

function TaskRow({ task, onToggle, onDelete, formatDue }: TaskRowProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 ${
        task.completed
          ? 'border-border/50 bg-muted/20 opacity-60'
          : task.isOverdue
            ? 'border-red-500/30 bg-red-500/5 glow-critical'
            : 'card-elevated hover:border-primary/20'
      }`}
    >
      <button
        onClick={onToggle}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {task.completed ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link2 size={10} />
            {task.patientAlias}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${task.isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}
          >
            <Clock size={10} />
            {formatDue(task.dueAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={task.priority} />
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
