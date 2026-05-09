'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { CaseStatus } from '@/lib/mockData';
import { createCase } from '@/lib/clinicalDataService';

interface AddCaseFormData {
  patientAlias: string;
  ward: string;
  chiefComplaint: string;
  history: string;
  examination: string;
  impression: string;
  plan: string;
  status: CaseStatus;
  ageGroup: string;
}

interface AddCaseModalProps {
  open: boolean;
  onClose: () => void;
}

const CASE_TEMPLATES = [
  { label: 'Chest Pain Protocol', complaint: 'Acute chest pain, diaphoresis', impression: 'ACS — R/O STEMI/NSTEMI' },
  { label: 'Fever Workup', complaint: 'Fever, rigors, malaise', impression: 'Febrile illness — source TBD' },
  { label: 'Dyspnea Assessment', complaint: 'Shortness of breath, exertional', impression: 'Dyspnea — cardiac vs respiratory' },
  { label: 'Altered Consciousness', complaint: 'Reduced GCS, confusion', impression: 'Altered consciousness — cause TBD' },
];

export default function AddCaseModal({ open, onClose }: AddCaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AddCaseFormData>({
    defaultValues: {
      status: 'active',
      ageGroup: '25–34',
    },
  });

  const applyTemplate = (tpl: typeof CASE_TEMPLATES[0]) => {
    setValue('chiefComplaint', tpl.complaint);
    setValue('impression', tpl.impression);
  };

  const onSubmit = async (data: AddCaseFormData) => {
    setIsSubmitting(true);
    try {
      const caseId = await createCase({
        patientAlias: data.patientAlias,
        chiefComplaint: data.chiefComplaint,
        history: data.history,
        examination: data.examination,
        impression: data.impression,
        plan: data.plan,
        status: data.status,
        ward: data.ward,
        ageGroup: data.ageGroup,
        taskCount: 0,
        overdueTaskCount: 0,
      });
      setIsSubmitting(false);
      toast.success(`Case created for ${data.patientAlias}`, {
        description: `Status: ${data.status} — saved locally, queued for sync`,
      });
      reset();
      setStep(1);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Failed to create case', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const STEPS = ['Patient Info', 'Clinical Data', 'Plan & Status'];

  return (
    <Modal open={open} onClose={handleClose} title="New Clinical Case" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step Indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={`step-${i + 1}`}>
                <button
                  type="button"
                  onClick={() => setStep(i + 1)}
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                    step === i + 1 ? 'text-primary' : step > i + 1 ? 'text-emerald-400' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      step === i + 1
                        ? 'bg-primary border-primary text-white'
                        : step > i + 1
                        ? 'bg-emerald-500 border-emerald-500 text-white' :'border-border text-muted-foreground'
                    }`}
                  >
                    {step > i + 1 ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:block">{s}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px transition-colors ${
                      step > i + 1 ? 'bg-emerald-500' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Step 1: Patient Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Patient Alias <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Use initials or pseudonym — never real name
                  </p>
                  <input
                    {...register('patientAlias', { required: 'Patient alias is required' })}
                    placeholder="e.g. J.Mensah"
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  />
                  {errors.patientAlias && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errors.patientAlias.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Ward / Unit
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Where the patient is admitted
                  </p>
                  <select
                    {...register('ward')}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="">Select ward</option>
                    {['CCU', 'ICU', 'Gen Med', 'Surgical', 'Neuro', 'Cardiology', 'OPD', 'Haematology', 'Infectious Disease', 'Urology', 'Paediatrics', 'Obs & Gynae'].map((w) => (
                      <option key={`ward-${w}`} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Age Group</label>
                  <select
                    {...register('ageGroup')}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    {['<15', '15–24', '25–34', '35–44', '45–54', '55–64', '65+'].map((ag) => (
                      <option key={`age-${ag}`} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Initial Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register('status', { required: true })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="stable">Stable</option>
                    <option value="critical">Critical</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CASE_TEMPLATES.map((tpl) => (
                    <button
                      key={`tpl-${tpl.label.replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-left px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all text-xs text-muted-foreground hover:text-foreground"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Clinical Data */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Chief Complaint <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                  placeholder="e.g. Acute chest pain, diaphoresis, onset 2 hours ago"
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
                {errors.chiefComplaint && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.chiefComplaint.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  History of Presenting Illness
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Onset, character, duration, associated features, relevant PMH
                </p>
                <textarea
                  {...register('history')}
                  rows={3}
                  placeholder="Describe the clinical history..."
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Examination Findings
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Vitals, systems review, key positive and negative findings
                </p>
                <textarea
                  {...register('examination')}
                  rows={3}
                  placeholder="BP, HR, Temp, SpO2 — systemic exam findings..."
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Clinical Impression <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('impression', { required: 'Clinical impression is required' })}
                  placeholder="e.g. NSTEMI — R/O STEMI, Bacterial pneumonia (CAP)"
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
                {errors.impression && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.impression.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Plan & Status */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Management Plan <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Investigations ordered, medications, referrals, monitoring plan
                </p>
                <textarea
                  {...register('plan', { required: 'Management plan is required' })}
                  rows={5}
                  placeholder="1. Investigations: FBC, CMP, ECG, CXR&#10;2. Medications: Aspirin 300mg stat, ...&#10;3. Referrals: Cardiology consult&#10;4. Monitoring: Hourly vitals, repeat ECG in 30min"
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none font-mono text-xs"
                />
                {errors.plan && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.plan.message}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-primary/8 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Encryption Notice
                </p>
                <p className="text-xs text-muted-foreground">
                  This case will be AES-encrypted before saving to IndexedDB. Your passcode
                  or device key is used for encryption — data is never stored in plaintext.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={step === 1 ? handleClose : () => setStep(step - 1)}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Case
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}