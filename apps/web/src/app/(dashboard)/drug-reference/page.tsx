'use client';

import React, { useState, useMemo } from 'react';
import { useDrugs } from '@/lib/hooks';
import type { DrugReference } from '@/lib/mockData';
import { Search, Pill, ChevronDown, ChevronRight, AlertCircle, Syringe, Tablet, FlaskConical, Info, Star, StarOff,  } from 'lucide-react';

const EXTRA_DRUGS: DrugReference[] = [
  { id: 'drug-006', name: 'Amoxicillin-Clavulanate', dosage: '625mg TDS or 1g BD (oral)', route: 'Oral', notes: 'Avoid if penicillin allergy. Take with food to reduce GI upset.', category: 'Antibiotic' },
  { id: 'drug-007', name: 'Clopidogrel', dosage: 'Loading: 300–600mg. Maintenance: 75mg daily', route: 'Oral', notes: 'Dual antiplatelet with aspirin for ACS. Check for CYP2C19 interactions.', category: 'Antiplatelet' },
  { id: 'drug-008', name: 'Valproate (Sodium)', dosage: '200–500mg BD–TDS (oral); 400–800mg IV loading', route: 'IV / Oral', notes: 'Monitor LFTs and FBC. Teratogenic — avoid in women of childbearing age.', category: 'Anticonvulsant' },
  { id: 'drug-009', name: 'Morphine', dosage: '2.5–10mg IV/IM q4h; PCA: 1mg bolus, 5min lockout', route: 'IV / IM / SC', notes: 'Titrate to pain. Monitor respiratory rate. Have naloxone available.', category: 'Opioid Analgesic' },
  { id: 'drug-010', name: 'Dexamethasone', dosage: '0.15mg/kg IV q6h (meningitis); 8mg IV (anti-emetic)', route: 'IV / Oral', notes: 'Give before or with first antibiotic dose in bacterial meningitis.', category: 'Corticosteroid' },
  { id: 'drug-011', name: 'Amlodipine', dosage: '5–10mg once daily', route: 'Oral', notes: 'Peripheral oedema common. Avoid abrupt withdrawal.', category: 'Antihypertensive' },
  { id: 'drug-012', name: 'Heparin (Unfractionated)', dosage: 'ACS: 60 IU/kg bolus, then 12 IU/kg/h infusion', route: 'IV', notes: 'Monitor aPTT. Risk of HIT — check platelets after 5 days.', category: 'Anticoagulant' },
  { id: 'drug-013', name: 'Tamsulosin', dosage: '0.4mg once daily (after meal)', route: 'Oral', notes: 'Postural hypotension risk. Avoid in severe hepatic impairment.', category: 'Alpha Blocker' },
  { id: 'drug-014', name: 'Paracetamol', dosage: '500mg–1g q4–6h (max 4g/day)', route: 'Oral / IV', notes: 'Reduce dose in hepatic impairment. Safe in pregnancy.', category: 'Analgesic/Antipyretic' },
  { id: 'drug-015', name: 'Omeprazole', dosage: '20–40mg once daily (before meals)', route: 'Oral / IV', notes: 'Use with NSAIDs or dual antiplatelet therapy. Check for drug interactions.', category: 'PPI' },
];

const ROUTE_ICON: Record<string, React.ElementType> = {
  Oral: Tablet,
  IV: Syringe,
  'IV / Oral': FlaskConical,
  'IV / IM': Syringe,
  'IV / IM / SC': Syringe,
  'IV / IM / Oral': Syringe,
  IM: Syringe,
};

export default function DrugReferencePage() {
  const baseDrugs = useDrugs();
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(['drug-001', 'drug-002', 'drug-005']));
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const allDrugs = useMemo(() => {
    return [...baseDrugs, ...EXTRA_DRUGS];
  }, [baseDrugs]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(allDrugs.map((d) => d.category))).sort()];
  }, [allDrugs]);


  const filtered = useMemo(() => {
    return allDrugs.filter((d) => {
      const matchSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()) ||
        d.notes.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'All' || d.category === category;
      const matchBookmark = !showBookmarksOnly || bookmarked.has(d.id);
      return matchSearch && matchCategory && matchBookmark;
    });
  }, [allDrugs, search, category, showBookmarksOnly, bookmarked]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getRouteIcon = (route: string) => {
    return ROUTE_ICON[route] || Pill;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Antibiotic: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      Antimalarial: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      Antidiabetic: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      Diuretic: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      Antiplatelet: 'bg-red-500/15 text-red-400 border-red-500/25',
      Anticonvulsant: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
      'Opioid Analgesic': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
      Corticosteroid: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
      Antihypertensive: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
      Antihypertensive: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
      Anticoagulant: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
      'Alpha Blocker': 'bg-teal-500/15 text-teal-400 border-teal-500/25',
      'Analgesic/Antipyretic': 'bg-lime-500/15 text-lime-400 border-lime-500/25',
      PPI: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    };
    return colors[cat] || 'bg-muted/50 text-muted-foreground border-border';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Drug Reference</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDrugs.length} drugs — fully offline, no internet required
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Offline Ready</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search drug name, category, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-border bg-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          > 
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            showBookmarksOnly
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Star size={12} />
          Bookmarked
        </button>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} results
        </span>
      </div>

      {/* Drug List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Pill size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No drugs found</p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); setShowBookmarksOnly(false); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((drug) => {
            const RouteIcon = getRouteIcon(drug.route);
            const isExpanded = expandedId === drug.id;
            const isBookmarked = bookmarked.has(drug.id);
            return (
              <div key={drug.id} className="card-elevated overflow-hidden transition-all duration-200">
                <div
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : drug.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <RouteIcon size={16} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{drug.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(drug.category)}`}>
                        {drug.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{drug.dosage}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{drug.route}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(drug.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-amber-400'}`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                      {isBookmarked ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                    </button>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={14} className="text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-3 animate-slide-up bg-muted/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dosage</p>
                        <p className="text-sm text-foreground font-mono">{drug.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Route</p>
                        <p className="text-sm text-foreground">{drug.route}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                      <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-400 mb-0.5">Clinical Notes</p>
                        <p className="text-xs text-foreground/80">{drug.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="flex items-center gap-2 px-6 py-3 border-t border-border shrink-0">
        <Info size={12} className="text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          For reference only. Always verify doses with current formulary and patient-specific factors.
        </p>
      </div>
    </div>
  );
}
