'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Search,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Info,
  ChevronRight,
  FileText,
  UserCheck,
  EyeOff,
  Key,
  CloudLightning,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  category: 'intro' | 'features' | 'security' | 'help';
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function UserManualPage() {
  const [activeTab, setActiveTab] = useState<string>('welcome');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: ManualSection[] = [
    {
      id: 'welcome',
      title: '1. Welcome to CWC',
      category: 'intro',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Welcome to the <strong>Clinical Workflow Companion (CWC)</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed text-sm">
            CWC is a personal, offline-first clinical workflow assistant designed to help you
            organize your daily clinical duties, track active patient cases, structure your clinical
            thinking, and keep a clean, secure record of your daily clinical tasks.
          </p>
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 mt-4">
            <Info className="text-primary shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Offline-First Philosophy</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your device is the primary source of truth. All data you enter is encrypted
                immediately and stored locally in your browser&apos;s internal database (IndexedDB
                via Dexie). No internet is required to use CWC.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'who-should-use',
      title: '2. Who Should Use This App',
      category: 'intro',
      icon: UserCheck,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Clinical Workflow Companion is custom-tailored for healthcare trainees and
            early-career clinicians who operate in high-pressure, high-cognitive-load environments:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>
              <strong className="text-foreground">Medical Interns and Junior Residents:</strong>{' '}
              Keep track of fast-moving patient lists, ward rounds, check-backs, and handovers
              without losing sticky notes.
            </li>
            <li>
              <strong className="text-foreground">Junior Clinicians & Trainees:</strong> Foster
              structured clinical thinking by standardizing case notes into structured inputs.
            </li>
            <li>
              <strong className="text-foreground">Clinical Students:</strong> Log non-identified
              case archetypes and common clinical scenarios they encounter during rotations for
              personal learning.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'who-should-not-use',
      title: '3. Who Should NOT Use This App',
      category: 'intro',
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-500">Critical Boundaries & Limits</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                To maintain patient safety and regulatory compliance, it is critical to understand
                the boundaries of this software.
              </p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
            <li>
              <strong className="text-foreground">Patients:</strong> CWC is not designed for
              self-diagnosis, symptom tracking, or medical advice.
            </li>
            <li>
              <strong className="text-foreground">Official Institutional Record Keeping:</strong>{' '}
              CWC is <strong>NOT</strong> an Electronic Medical Record (EMR) or Electronic Health
              Record (EHR) system. It must never be used as the official legal record of patient
              care.
            </li>
            <li>
              <strong className="text-foreground">Direct Clinical Decision Support:</strong> CWC
              does not possess clinical intelligence. It does not calculate drug doses, recommend
              diagnostics, or recommend plans of action.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'core-purpose',
      title: '4. Core Purpose',
      category: 'intro',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            Modern clinical work is fast-paced, highly fragmented, and characterized by constant
            interruptions. On a typical shift, a junior clinician faces extreme cognitive load:
            managing handovers, tracking dozens of laboratory check-backs, and executing diagnostic
            plans across multiple wards.
          </p>
          <p className="leading-relaxed">
            CWC solves these challenges by serving as an external memory system:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-muted/40 border border-border rounded-lg">
              <h5 className="font-semibold text-foreground text-xs mb-1">Reduces Cognitive Load</h5>
              <p className="text-xs leading-relaxed">
                By externalizing tasks and timelines into a structured digital application, you free
                up mental capacity to focus on direct patient care.
              </p>
            </div>
            <div className="p-3 bg-muted/40 border border-border rounded-lg">
              <h5 className="font-semibold text-foreground text-xs mb-1">
                Standardizes Clinical Thinking
              </h5>
              <p className="text-xs leading-relaxed">
                The structured case note template helps you systematically review each case,
                ensuring no vital diagnostic steps are omitted.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'before-you-start',
      title: '5. Before You Start',
      category: 'intro',
      icon: Key,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground text-sm">
            Key Setup & Security Expectations
          </h4>
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 w-5 h-5 mt-0.5" />
              <div>
                <h5 className="text-xs font-semibold text-foreground">
                  The Passcode is Your Only Key
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  CWC does not store your passcode on our servers or on your device&apos;s
                  filesystem. If you lose or forget your passcode,{' '}
                  <strong>your local data will become permanently unrecoverable</strong>.
                </p>
              </div>
            </div>
            <p className="leading-relaxed mt-2">
              Ensure your device has at least 500MB of free storage space to accommodate local
              database allocations. Make sure to enable local device passcode or PIN lock security.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'getting-started',
      title: '6. Getting Started',
      category: 'intro',
      icon: ChevronRight,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground text-sm">Installation & Initialization</h4>
          <ol className="space-y-3 list-decimal pl-5">
            <li>
              <strong className="text-foreground">Open CWC:</strong> Navigate to the Clinical
              Workflow Companion URL using a modern browser.
            </li>
            <li>
              <strong className="text-foreground">Install PWA:</strong> Tap the **Share** button on
              iOS Safari and choose *Add to Home Screen*, or tap the menu on Android Chrome and
              click *Install App*.
            </li>
            <li>
              <strong className="text-foreground">Choose Mode:</strong> Select **Local-Only Mode**
              (no sign-up required, data strictly local) or **Cloud Sync Mode** (enables
              cross-device encrypted backup synchronization).
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: 'dashboard-overview',
      title: '7. Dashboard Overview',
      category: 'features',
      icon: FileText,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            The Dashboard is your clinical command center, designed to provide immediate situational
            awareness:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Navigation Bar:</strong> Switch between clinical
              case tracker, tasks, logbook, and drug reference. Displays connection status and
              quick-lock.
            </li>
            <li>
              <strong className="text-foreground">Metrics Grid:</strong> Real-time counts of active
              cases, pending tasks, overdue alerts, and task completion percentages.
            </li>
            <li>
              <strong className="text-foreground">Case Feed:</strong> A consolidated view of active
              patient cards highlighting critical reviews.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'case-notes',
      title: '8. Clinical Case Notes Module',
      category: 'features',
      icon: FileText,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <h5 className="text-xs font-semibold text-foreground">
                Layered Data Architecture Best Practice
              </h5>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Direct identifiers (names, exact DOBs, national IDs, and phone numbers) are
                restricted from the external export layer. These elements are used only within the
                internal encrypted layer or mapped in the transient mapping layer. Use standard
                Patient Aliases (e.g., <em>Case-A</em>, <em>Bed-3B</em>) as primary external
                identifiers for sharing and case coordination.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-2">
              Creating Structured Case Notes:
            </h4>
            <ul className="space-y-1 list-disc pl-5">
              <li>
                <strong>Chief Complaint:</strong> Primary presentation symptom (e.g., chest pain).
              </li>
              <li>
                <strong>History:</strong> Brief, relevant clinical background.
              </li>
              <li>
                <strong>Examination:</strong> Objective examination findings.
              </li>
              <li>
                <strong>Impression:</strong> Working diagnoses or differentials.
              </li>
              <li>
                <strong>Plan:</strong> Immediate, actionable clinical steps.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'case-tracker',
      title: '9. Active Case Tracker',
      category: 'features',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            The Active Case Tracker acts as your digital ward whiteboard, enabling you to review and
            filter your patients easily:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Search and Filter:</strong> Type keywords to
              filter immediately through decrypted local records. Toggle between Active, Pending
              Review, and Archived cases.
            </li>
            <li>
              <strong className="text-foreground">Critical Highlighting:</strong> Cases flagged as
              high priority glow with distinctive borders to focus your attention.
            </li>
            <li>
              <strong className="text-foreground">Overdue Reviews:</strong> Automatically flags
              cases containing pending tasks that have crossed their due date targets.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'task-management',
      title: '10. Task Management',
      category: 'features',
      icon: CheckCircle,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground text-sm">Actionable Shift Lists</h4>
          <p className="leading-relaxed">
            Every clinical task in CWC is linked to a patient case, providing context:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Due Dates:</strong> Assign target completion
              times. If left blank, the service layer defaults it to **1 hour**.
            </li>
            <li>
              <strong className="text-foreground">Priorities:</strong> Flag tasks as High, Medium,
              or Low.
            </li>
            <li>
              <strong className="text-foreground">Overdue Alerts:</strong> Incomplete tasks past
              their target time turn red and display the time elapsed.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'drug-reference',
      title: '11. Drug Reference',
      category: 'features',
      icon: PillIcon,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <h5 className="text-xs font-semibold text-foreground">
                Clinical Limitations Warning
              </h5>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                The Drug Reference is a standardized offline formulary for rapid informational
                checkups. It is **NOT** a replacement for local prescribing guides, calculators, or
                clinical pharmacologists.
              </p>
            </div>
          </div>
          <p className="leading-relaxed">
            Type any generic drug name or drug class in the search bar. Expands to display dosage
            forms, routes of administration, and critical clinical notes (e.g., contraindications or
            renal adjustments).
          </p>
        </div>
      ),
    },
    {
      id: 'personal-logbook',
      title: '12. Personal Logbook',
      category: 'features',
      icon: Sparkles,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            The Personal Case Logbook provides secure, aggregate clinical workflow metrics:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Case Distributions:</strong> Visual charts of
              active, pending, and archived case balances.
            </li>
            <li>
              <strong className="text-foreground">Trend Identifiers:</strong> Displays frequency of
              encounter clinical complaints, providing valuable insights for reflective study or
              logging training logs.
            </li>
            <li>
              <strong className="text-foreground">Task Metrics:</strong> Tracks task completion
              performance rates.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'backup-restore',
      title: '13. Backup & Restore',
      category: 'security',
      icon: Key,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground text-sm">Disaster Recovery Protocol</h4>
          <div className="space-y-2">
            <div className="p-3 bg-muted/40 border border-border rounded-lg">
              <span className="block font-semibold text-foreground text-xs mb-1">
                Exporting Backup
              </span>
              <p className="text-xs leading-relaxed">
                Go to Settings → Data Management → click **Export**. Compiles encrypted clinical
                data records into a secure `.json` file.
              </p>
            </div>
            <div className="p-3 bg-muted/40 border border-border rounded-lg">
              <span className="block font-semibold text-foreground text-xs mb-1">
                Restoring Backup
              </span>
              <p className="text-xs leading-relaxed">
                Go to Settings → click **Import** → upload JSON file. CWC decrypts a sample record
                using your current active passcode. If the passcode does not match, the import
                aborts to prevent corruption.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sync-feature',
      title: '14. Sync Feature',
      category: 'security',
      icon: CloudLightning,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            The optional Sync system acts as a secure, volatile backup broker across your devices:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Offline Queue:</strong> Updates are queued locally
              inside IndexedDB when connection is lost, and auto-pushed to servers upon connection
              restoration.
            </li>
            <li>
              <strong className="text-foreground">End-to-End Encryption:</strong> Records are
              encrypted *before* they leave your client browser. Our servers never hold your
              decryption passcode.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'security-privacy',
      title: '15. Security & Privacy',
      category: 'security',
      icon: EyeOff,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            CWC implements zero-knowledge, bank-grade encryption to safeguard patient
            confidentiality:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">AES-256-GCM Local Database:</strong> Case notes
              are encrypted before committing to IndexedDB.
            </li>
            <li>
              <strong className="text-foreground">In-Memory Passcodes:</strong> Decryption keys are
              held in volatile memory and are cleared on logouts, tab closures, or 15 minutes of
              inactivity.
            </li>
            <li>
              <strong className="text-foreground">Lockout Enforcement:</strong> 3 consecutive
              incorrect attempts trigger a temporary full-screen lockout.
            </li>
            <li>
              <strong className="text-foreground">Cache-Only Zustand State:</strong> All active
              clinical data in memory is cached inside a pure, reactive Zustand store that is kept
              in lockstep with your local database via optimized transactions. No clinical data is
              ever written to unencrypted persistent caches or state models.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: '16. Troubleshooting',
      category: 'help',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <ul className="space-y-3 list-none pl-0">
            <li className="p-3 bg-muted/40 border border-border rounded-lg">
              <strong className="text-foreground block text-xs mb-1">Forgot passcode:</strong>
              <p className="text-xs">
                Zero-knowledge means we cannot reset passcodes. Local data is unrecoverable. You
                must clear browser site data to initialize a clean workspace.
              </p>
            </li>
            <li className="p-3 bg-muted/40 border border-border rounded-lg">
              <strong className="text-foreground block text-xs mb-1">
                Sync fails or indicator says &quot;Offline&quot;:
              </strong>
              <p className="text-xs">
                Hospital firewalls might block sync sockets. CWC keeps data safe in local storage
                and will upload when standard cellular or open network access returns.
              </p>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'best-practices',
      title: '17. Best Practice Guidelines',
      category: 'help',
      icon: CheckCircle,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Morning rounds:</strong> Spend 5 minutes pre-shift
              listing known check-backs.
            </li>
            <li>
              <strong className="text-foreground">Contextualize checklists:</strong> Always assign
              tasks directly to a patient alias dropdown.
            </li>
            <li>
              <strong className="text-foreground">Handovers:</strong> Review and check off finished
              tasks before leaving. Archive resolved cases to preserve board clarity.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'warnings',
      title: '18. Important Warnings',
      category: 'help',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
            <p className="text-xs text-foreground font-semibold">Important Warnings:</p>
            <ul className="text-xs list-disc pl-4 space-y-1">
              <li>
                Direct patient identifiers (such as names, exact DOBs, and national IDs) are used
                only within the internal encrypted layer or mapped in the transient mapping layer,
                and are excluded from the export layer.
              </li>
              <li>Do NOT share your private decryption passcode.</li>
              <li>Do NOT rely on the drug reference as an absolute prescribing authority.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: '19. FAQ',
      category: 'help',
      icon: HelpCircle,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground max-h-[50vh] overflow-y-auto pr-2">
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              1. Is this app HIPAA/GDPR compliant?
            </h5>
            <p className="text-xs mt-0.5">
              Yes. CWC secures all workflow data through a robust, three-layered data architecture.
              The Internal Clinical Layer is client-side encrypted (AES-256-GCM) and stored purely
              local-only. Transient mappings remain strictly in-memory and are never persisted,
              while the External Export Layer is fully de-identified and alias-based only. By
              excluding direct patient identifiers from persistent long-term storage and export, CWC
              aligns perfectly with data privacy regulations.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              2. Where is my data actually stored and how is it cached?
            </h5>
            <p className="text-xs mt-0.5">
              Locally on your physical device within the browser&apos;s sandboxed IndexedDB database
              via Dexie. For rapid UI rendering, CWC holds an ephemeral, in-memory Zustand cache
              which is strictly repopulated from IndexedDB during each database mutation transaction
              via a single-transaction restoration routine (`restoreDataFromDB`). If you enable
              cloud sync, an encrypted copy of this database is stored on our secure servers.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              3. What happens if I lose my phone?
            </h5>
            <p className="text-xs mt-0.5">
              If you enabled cloud sync, simply open the app on a new device, log in, and enter your
              original encryption passcode to restore your cases and tasks. If you were in
              local-only mode, you can restore your data using your last exported JSON backup file
              and your original passcode.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              4. Can other doctors see my active cases?
            </h5>
            <p className="text-xs mt-0.5">
              No. CWC is designed as a personal workflow companion. There is no collaborative view
              or shared database.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              5. Why does the app lock itself automatically?
            </h5>
            <p className="text-xs mt-0.5">
              To prevent unauthorized access to clinical notes if you leave your device unattended
              on a ward desk or nurse&apos;s station.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              6. Can I use the app on both my computer and my phone?
            </h5>
            <p className="text-xs mt-0.5">
              Yes. If you register an account and enable cloud sync, logging in on both devices with
              the same credentials and passcode will sync your active workflows.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              7. What does &quot;Last-Write-Wins&quot; mean?
            </h5>
            <p className="text-xs mt-0.5">
              If you edit the same case on two different devices while offline, the changes made
              most recently (timestamped by the device) will overwrite the older changes once both
              devices sync online.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              8. Does CWC consume a lot of mobile data?
            </h5>
            <p className="text-xs mt-0.5">
              No. Because CWC only synchronizes highly optimized, encrypted text blocks, it uses a
              minimal amount of data.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              9. Why does my task list show a default 1-hour due date?
            </h5>
            <p className="text-xs mt-0.5">
              To keep you focused and prevent tasks from languishing. If a task is not
              time-sensitive, you can easily adjust its due date during creation.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              10. Can I customize the drug library?
            </h5>
            <p className="text-xs mt-0.5">
              The drug library is a standardized offline reference. However, you can add custom
              administration notes directly to your patient case notes or task descriptions.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              11. What happens if I clear my browser history?
            </h5>
            <p className="text-xs mt-0.5">
              If you clear your browser&apos;s &quot;Site Data&quot; or &quot;Offline Website
              Data&quot;, the local IndexedDB database may be deleted. If this happens, you will
              need to restore your data from a backup file or cloud sync.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              12. How do I know if my data is synced?
            </h5>
            <p className="text-xs mt-0.5">
              The navigation bar displays a sync status icon. A green checkmark indicates all
              changes have successfully synchronized with the cloud.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              13. Does CWC run in the background?
            </h5>
            <p className="text-xs mt-0.5">
              Yes. When installed as a PWA, background processes manage the sync queue automatically
              when network availability changes.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">
              14. What should I do if my passcode is compromised?
            </h5>
            <p className="text-xs mt-0.5">
              Go to Settings, scroll to Encryption Layer, click Update Encryption Passcode, and
              enter a new passcode. CWC will automatically decrypt and re-encrypt all local records
              using your new passcode.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground text-xs">15. Is this app free to use?</h5>
            <p className="text-xs mt-0.5">
              Yes. The Clinical Workflow Companion is free to use for junior clinicians, interns,
              and trainees.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'support',
      title: '20. Support',
      category: 'help',
      icon: LifeBuoy,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            If you encounter database issues, errors, or security questions:
          </p>
          <ul className="space-y-1 list-disc pl-5">
            <li>
              <strong>Telemetry:</strong> Go to Settings → click **Export Telemetry Logs** to
              download a diagnostic audit.
            </li>
            <li>
              <strong>Support Email:</strong> Contact us at{' '}
              <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">
                cwc-support@domain.local
              </code>
              .
            </li>
            <li>
              <strong>Privacy Notice:</strong> Do NOT attach screenshot attachments of patient case
              logs.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter((sec) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return sec.title.toLowerCase().includes(query) || sec.id.toLowerCase().includes(query);
  });

  const categories = [
    { id: 'intro', label: 'General & Setup' },
    { id: 'features', label: 'Feature Guides' },
    { id: 'security', label: 'Security & Backup' },
    { id: 'help', label: 'Troubleshooting & Support' },
  ];

  const activeSection =
    filteredSections.find((sec) => sec.id === activeTab) || filteredSections[0] || sections[0];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="text-primary w-6 h-6" />
            CWC Clinical User Manual
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive system guide, workflows, best practices, and disaster recovery steps.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search manual sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Main Panel layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col bg-muted/30 border border-border rounded-xl min-h-[250px] lg:min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Manual Contents
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {categories.map((cat) => {
              const catSections = filteredSections.filter((s) => s.category === cat.id);
              if (catSections.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  <span className="px-2 block text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">
                    {cat.label}
                  </span>
                  {catSections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveTab(sec.id)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                          activeTab === sec.id
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sec.title.replace(/^\d+\.\s*/, '')}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden min-h-0">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/10 shrink-0">
            {React.createElement(activeSection.icon, {
              className: 'w-5 h-5 text-primary shrink-0',
            })}
            <h2 className="text-base font-bold text-foreground">{activeSection.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{activeSection.content}</div>
        </div>
      </div>
    </div>
  );
}

// Inline fallback PillIcon to ensure build success
function PillIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}
