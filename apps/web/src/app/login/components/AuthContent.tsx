'use client';

import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import Modal from '@/components/ui/Modal';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { setEnableSeedData } from '@/lib/config';

export default function AuthContent() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const disclaimerAcceptedRef = useRef<boolean>(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted the disclaimer
    let isAccepted: string | null = null;
    try {
      isAccepted = localStorage.getItem('cwc_disclaimer_accepted');
    } catch (e) {
      console.warn('LocalStorage is disabled or restricted:', e);
    }
    if (isAccepted !== 'true' && !disclaimerAcceptedRef.current) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem('cwc_disclaimer_accepted', 'true');
    } catch (e) {
      console.warn('Failed to save disclaimer acceptance to localStorage:', e);
    }
    disclaimerAcceptedRef.current = true;
    setShowDisclaimer(false);

    // If first visit has not been completed, show welcome onboarding!
    let firstVisitCompleted = 'false';
    try {
      firstVisitCompleted = localStorage.getItem('cwc_first_visit_completed') || 'false';
    } catch (e) {
      console.warn('Failed to read first visit completed flag:', e);
    }

    if (firstVisitCompleted !== 'true') {
      setShowWelcome(true);
    }
  };

  const handleStartFresh = () => {
    setEnableSeedData(false);
    try {
      localStorage.setItem('cwc_first_visit_completed', 'true');
    } catch (e) {
      console.warn('Failed to save welcome state:', e);
    }
    setShowWelcome(false);
  };

  const handleLoadDemo = () => {
    setEnableSeedData(true);
    try {
      localStorage.setItem('cwc_first_visit_completed', 'true');
    } catch (e) {
      console.warn('Failed to save welcome state:', e);
    }
    setShowWelcome(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background">
      {/* Left Panel — Branding (Hidden purely decorative grid on mobile, order second) */}
      <div
        className="flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden order-2 lg:order-1"
        style={{
          background: 'linear-gradient(135deg, #0D1A35 0%, #0B1120 60%, #0D1A35 100%)',
        }}
      >
        {/* Subtle grid overlay - hidden on mobile to reduce noise */}
        <div
          className="absolute inset-0 opacity-5 hidden lg:block"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-6 py-10 lg:px-10 lg:py-10">
          {/* Logo - Hidden on mobile because it's above the form */}
          <div className="hidden lg:flex items-center gap-3">
            <AppLogo size={36} />
            <div>
              <span className="block font-bold text-lg text-foreground tracking-tight leading-none">
                ClinicalCWC
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Clinical Workflow Companion
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center relative mt-6 lg:mt-0">
            {/* Hero Image / Banner - Scaled down on mobile */}
            <div className="relative w-full aspect-[2/1] md:aspect-[4/3] rounded-2xl overflow-hidden mb-6 lg:mb-8 border border-border shadow-2xl group">
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 transition-opacity duration-500 group-hover:opacity-0" />
              <AppImage
                src="/assets/images/login_hero.png"
                alt="Clinical Workflow Companion"
                fill
                priority
                className="object-cover transform transition-transform duration-700 group-hover:scale-105"
                unoptimized={true}
              />
            </div>

            <div className="max-w-sm relative z-20">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                The clinical <br />
                <span className="text-primary">workflow</span> companion
              </h2>
              <p className="text-sm text-muted-foreground mt-3 lg:mt-4 leading-relaxed">
                A secure, offline-first clinical workspace for medical interns. Encrypts your data
                locally and optionally syncs it securely across your devices.
              </p>
            </div>
          </div>

          {/* Footer */}
          {/* Footer removed per user request */}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-10 overflow-y-auto order-1 lg:order-2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={32} />
            <span className="font-bold text-lg text-foreground">ClinicalCWC</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {tab === 'login' ? 'Sign in to sync' : 'Create an account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {tab === 'login'
                ? 'Access your encrypted case data across devices'
                : 'Register to enable cross-device encrypted sync'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 bg-muted/50 rounded-xl mb-6 border border-border">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-card text-foreground shadow-card border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-card text-foreground shadow-card border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>

      {/* DELIVERABLE 2 — DISCLAIMER MODAL */}
      <Modal
        open={showDisclaimer}
        onClose={() => {}}
        title="Clinical Workflow Companion — Safety Disclaimer & Privacy Terms"
        size="lg"
        preventClose={true}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="text-amber-500 shrink-0 w-6 h-6 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Workflow Safety & Consent Required
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Please read this clinical workflow and safety disclosure before logging in or
                registering. By organizing your rounding logs and tasks in CWC, you agree to these
                operational guidelines.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-foreground">
                  Case-Based Shift & Continuity Tracking
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  CWC is an offline-first clinical workflow support tool enabling junior clinicians
                  to organize rounding logs, coordinate tasks, and track patients across shifts. To
                  maintain clinical progression and case continuity, CWC structures workflows around
                  individual care episodes (cases) where the Patient Alias serves as the primary
                  external identifier, supported by optional internal continuity metadata.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-foreground">
                  Layered Data & Privacy Architecture
                </h5>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed space-y-1.5">
                  <p>
                    CWC preserves clinical precision and workflow usability while protecting patient
                    privacy through a robust three-layered data architecture:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>Internal Clinical Layer (Full Fidelity):</strong> Runs offline and
                      local-only, protected by secure client-side AES-256-GCM database encryption.
                      This layer supports full-precision timestamps, precise medication
                      administration timing, detailed progression notes, and internal hospital
                      reference IDs.
                    </li>
                    <li>
                      <strong>Optional Transient Mapping Layer:</strong> Enables session-based,
                      transient patient identity reference mapping to coordinate shift transitions
                      in real-time. This mapping is kept strictly in-memory and is not persisted in
                      long-term databases or external storage.
                    </li>
                    <li>
                      <strong>External Export Layer (De-identified):</strong> Generates
                      de-identified workflow summaries for safe clinical handovers. In this layer,
                      standard Patient Aliases are used as the primary identifier, and direct
                      identifiers or precise timestamps are excluded from export.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500">
                <AlertTriangle size={14} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-foreground">
                  Structured Clinical Continuity Metadata
                </h5>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed space-y-1">
                  <p>
                    To support clinical continuity, direct identifiers (such as names, exact DOBs,
                    national IDs, and phone numbers) are used only within the internal encrypted
                    layer or mapped in the transient mapping layer, and are excluded from the export
                    layer. Clinicians are encouraged to leverage CWC&apos;s structured metadata
                    schema for active ward tracking:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>
                      <strong>Case ID & Patient Alias (Primary Keys):</strong> Primary keys for care
                      episode tracking. Patient Alias remains the primary external identifier.
                    </li>
                    <li>
                      <strong>Ward, Bed, & Unit Identifiers:</strong> e.g., <em>Bed-2B</em>,{' '}
                      <em>Ward-4A</em> (used only within internal encrypted layer).
                    </li>
                    <li>
                      <strong>Encounter, Shift, & Session Identifiers:</strong> e.g.,{' '}
                      <em>Shift-A</em>, <em>Morning-Rounds</em> (used only within internal encrypted
                      layer).
                    </li>
                    <li>
                      <strong>Internal Hospital Reference IDs:</strong> Stored locally only
                      (excluded from export layer) to maintain clinical continuity.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-foreground">
                  No Medical Decision Automation
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  CWC is a non-medical device. It does not automate diagnoses, provide clinical
                  advice, or verify drug dosages. Clinical decisions, prescriptions, and official
                  charting remain the sole responsibility of the licensed provider.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Lock size={14} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-foreground">
                  Volatile Client-Side Encryption
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Your workspace is locally encrypted via AES-256-GCM. Decryption keys are derived
                  from your volatile passcode in memory and are never uploaded to any servers. If
                  lost, your encrypted data is permanently unrecoverable.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <button
              onClick={handleAcceptDisclaimer}
              className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.99] font-semibold text-sm rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              I Understand & Agree
            </button>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              By clicking &quot;I Understand &amp; Agree&quot;, you acknowledge that CWC is a
              case-based clinical tracking tool, not a medical device, and that you agree to use our
              layered data architecture.
            </p>
          </div>
        </div>
      </Modal>

      {/* DELIVERABLE: FIRST-TIME USER WELCOME EXPERIENCE */}
      <Modal
        open={showWelcome}
        onClose={() => {}}
        title="Welcome to ClinicalCWC"
        size="md"
        preventClose={true}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <AppLogo size={24} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-foreground leading-relaxed font-medium">
                ClinicalCWC helps you organize clinical cases, tasks, and workflow in a secure,
                offline-first environment. All data is stored locally and encrypted on your device.
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                You can start with an empty workspace or explore optional sample data to understand
                the structure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleStartFresh}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/40 hover:bg-card/90 hover:border-primary/45 transition-all text-center group"
            >
              <span className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Start Fresh Workspace
              </span>
              <span className="block text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                Begin with an empty clinical dashboard to manage your active shifts from scratch.
              </span>
            </button>

            <button
              onClick={handleLoadDemo}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/40 hover:bg-card/90 hover:border-emerald-500/45 transition-all text-center group"
            >
              <span className="block text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                Load Demo Data
              </span>
              <span className="block text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                Explore a pre-populated workspace with sample cases, patient rounds, and logs.
              </span>
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center leading-relaxed max-w-xs mx-auto">
            This workspace selection is neutral, generic, and fully reusable across any healthcare
            institution, clinician, or multi-user environment.
          </p>
        </div>
      </Modal>
    </div>
  );
}
