'use client';

import React, { useState } from 'react';
import { createCase, updateCase, deleteCase } from '@/lib/clinicalDataService';
import { Plus, Trash2 } from 'lucide-react';
import { type CaseStatus, type ClinicalCase } from '@/lib/mockData';
import { useCases } from '@/lib/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  AlertTriangle,
  Clock,
  Activity,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Edit2,
  CheckSquare,
  RefreshCw,
  Zap,
  Users,
  TrendingUp,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: CaseStatus | 'all' }[] = [
  { label: 'All Cases', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Active', value: 'active' },
  { label: 'Stable', value: 'stable' },
  { label: 'Discharged', value: 'discharged' },
];

const WARD_OPTIONS = ['All Wards', 'CCU', 'ICU', 'Gen Med', 'Neuro', 'Cardiology', 'Haematology', 'Surgical', 'Urology', 'Infectious Disease', 'OPD'];

const CASE_TEMPLATES = [
  {
    name: 'Chest Pain (ACS)',
    data: { chiefComplaint: 'Chest pain', history: 'Sudden onset chest pain radiating to left arm', examination: 'BP elevated, HR elevated. ECG shows ST changes.', impression: 'Acute Coronary Syndrome (Rule out STEMI)', plan: 'Aspirin 300mg, Clopidogrel 300mg, ECG, Troponin, Cardiology consult.', status: 'critical' as CaseStatus, ward: 'CCU', ageGroup: '55–64' }
  },
  {
    name: 'Pneumonia',
    data: { chiefComplaint: 'Fever, cough, dyspnea', history: 'Productive cough, fever, shortness of breath', examination: 'Dullness to percussion, crepitations on auscultation.', impression: 'Community-acquired pneumonia', plan: 'Amoxicillin-clavulanate, CXR, Sputum culture, Oxygen if SpO2 < 92%.', status: 'active' as CaseStatus, ward: 'Gen Med', ageGroup: '35–44' }
  },
  {
    name: 'Uncomplicated Malaria',
    data: { chiefComplaint: 'Fever, chills, headache', history: 'Intermittent fever with rigors, general malaise.', examination: 'Febrile, pallor, no focal neurological signs.', impression: 'Uncomplicated Malaria', plan: 'Artemether-Lumefantrine (AL), Paracetamol, FBC, mRDT.', status: 'stable' as CaseStatus, ward: 'OPD', ageGroup: '25–34' }
  }
];


export default function ActiveCaseTrackerPage() {
  const cases = useCases();
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All Wards');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);
  const [formData, setFormData] = useState({
    patientAlias: '', chiefComplaint: '', history: '', examination: '', impression: '', plan: '', status: 'active' as CaseStatus, ward: 'Gen Med', ageGroup: '25–34'
  });

  
  const handleOpenModal = (c?: ClinicalCase) => {
    if (c) {
      setEditingCase(c);
      setFormData({
        patientAlias: c.patientAlias, chiefComplaint: c.chiefComplaint, history: c.history, examination: c.examination, impression: c.impression, plan: c.plan, status: c.status, ward: c.ward || 'Gen Med', ageGroup: c.ageGroup || '25–34'
      });
    } else {
      setEditingCase(null);
      setFormData({ patientAlias: '', chiefComplaint: '', history: '', examination: '', impression: '', plan: '', status: 'active', ward: 'Gen Med', ageGroup: '25–34' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.patientAlias || !formData.chiefComplaint) return;
    if (editingCase) {
      await updateCase(editingCase.id, formData);
    } else {
      await createCase({ ...formData, taskCount: 0, overdueTaskCount: 0 });
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this case and its tasks?')) {
      await deleteCase(id);
    }
  };

  const applyTemplate = (index: number) => {
    if (index === -1) return;
    const template = CASE_TEMPLATES[index].data;
    setFormData((prev) => ({ ...prev, ...template }));
  };

  const now = new Date();

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch =
      search === '' ||
      c.patientAlias.toLowerCase().includes(search.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(search.toLowerCase()) ||
      c.impression.toLowerCase().includes(search.toLowerCase());
    const matchWard = wardFilter === 'All Wards' || c.ward === wardFilter;
    const matchOverdue = !showOverdueOnly || c.overdueTaskCount > 0;
    return matchStatus && matchSearch && matchWard && matchOverdue;
  });

  const criticalCount = cases.filter((c) => c.status === 'critical').length;
  const overdueCount = cases.filter((c) => c.overdueTaskCount > 0).length;
  const activeCount = cases.filter((c) => c.status === 'active').length;
  const totalTasks = cases.reduce((sum, c) => sum + c.taskCount, 0);

  const getTimeSince = (iso: string) => {
    const diff = now.getTime() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const getReviewUrgency = (c: ClinicalCase) => {
    const h = (now.getTime() - new Date(c.updatedAt).getTime()) / 3600000;
    if (c.status === 'critical' && h > 2) return 'overdue';
    if (c.status === 'active' && h > 6) return 'due';
    return 'ok';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Active Case Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time overview of all patient cases — sorted by urgency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border shrink-0">
        {[
          { label: 'Critical', value: criticalCount, icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Active', value: activeCount, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Overdue Reviews', value: overdueCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${kpi.bg}`}>
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
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Ward Filter */}
        <div className="relative">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-border bg-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {WARD_OPTIONS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Overdue toggle */}
        <button
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            showOverdueOnly
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Clock size={12} />
          Overdue Only
        </button>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {cases.length} cases
        </span>
      </div>

      {/* Case Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No cases match your filters</p>
            <button
              onClick={() => { setStatusFilter('all'); setSearch(''); setWardFilter('All Wards'); setShowOverdueOnly(false); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((c) => {
            const urgency = getReviewUrgency(c);
            const isExpanded = expandedCase === c.id;
            return (
              <CaseCard
                key={c.id}
                caseItem={c}
                urgency={urgency}
                isExpanded={isExpanded}
                onToggle={() => setExpandedCase(isExpanded ? null : c.id)}
                timeSince={getTimeSince(c.updatedAt)} onEdit={() => handleOpenModal(c)} onDelete={() => handleDelete(c.id)}
              />
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl my-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editingCase ? 'Edit Case' : 'New Case'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {!editingCase && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Load Template</label>
                  <select onChange={(e) => applyTemplate(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="-1">-- Select a Template (Optional) --</option>
                    {CASE_TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Patient Alias *</label>
                  <input type="text" value={formData.patientAlias} onChange={(e) => setFormData({...formData, patientAlias: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm" placeholder="e.g. J.Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Ward</label>
                  <select value={formData.ward} onChange={(e) => setFormData({...formData, ward: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm">
                    {WARD_OPTIONS.filter(w => w !== 'All Wards').map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chief Complaint *</label>
                  <input type="text" value={formData.chiefComplaint} onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">History</label>
                  <textarea value={formData.history} onChange={(e) => setFormData({...formData, history: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm h-20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Examination</label>
                  <textarea value={formData.examination} onChange={(e) => setFormData({...formData, examination: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm h-20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impression</label>
                  <textarea value={formData.impression} onChange={(e) => setFormData({...formData, impression: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm h-20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Plan</label>
                  <textarea value={formData.plan} onChange={(e) => setFormData({...formData, plan: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm h-20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as CaseStatus})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm">
                    <option value="active">Active</option>
                    <option value="critical">Critical</option>
                    <option value="stable">Stable</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Age Group</label>
                  <select value={formData.ageGroup} onChange={(e) => setFormData({...formData, ageGroup: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm">
                    <option value="15-24">15-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formData.patientAlias || !formData.chiefComplaint} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">Save Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CaseCardProps {
  onEdit: () => void;
  onDelete: () => void;
  caseItem: ClinicalCase;
  urgency: 'overdue' | 'due' | 'ok';
  isExpanded: boolean;
  onToggle: () => void;
  timeSince: string;
}

function CaseCard({ caseItem: c, urgency, isExpanded, onToggle, timeSince, onEdit, onDelete }: CaseCardProps) {
  const urgencyBorder = urgency === 'overdue' ? 'border-l-red-500' : urgency === 'due' ? 'border-l-amber-500' : 'border-l-border';

  return (
    <div className={`card-elevated border-l-4 ${urgencyBorder} transition-all duration-200 ${c.status === 'critical' ? 'glow-critical' : ''}`}>
      {/* Main Row */}
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Status indicator */}
        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
          <StatusBadge status={c.status} pulse={c.status === 'critical'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{c.patientAlias}</span>
                {c.ward && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                    {c.ward}
                  </span>
                )}
                {urgency === 'overdue' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertTriangle size={11} />
                    Review overdue
                  </span>
                )}
                {urgency === 'due' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                    <Clock size={11} />
                    Review due
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{c.chiefComplaint}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground tabular-nums">{timeSince}</span>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                title="View details"
              >
                <Eye size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" 
                title="Edit case"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" 
                title="Delete case"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Task indicators */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <CheckSquare size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{c.taskCount} tasks</span>
            </div>
            {c.overdueTaskCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">{c.overdueTaskCount} overdue</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{c.ageGroup}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border px-5 py-4 grid grid-cols-2 gap-4 animate-slide-up">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Impression</p>
            <p className="text-sm text-foreground">{c.impression}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
            <p className="text-sm text-foreground">{c.plan}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">History</p>
            <p className="text-sm text-foreground">{c.history}</p>
          </div>
          <div className="col-span-2 flex items-center gap-2 pt-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors">
              <Edit2 size={12} />
              Update Case
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-muted/60 hover:text-foreground transition-colors">
              <CheckSquare size={12} />
              View Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
