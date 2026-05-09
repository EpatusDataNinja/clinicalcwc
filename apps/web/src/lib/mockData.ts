export type CaseStatus = 'active' | 'stable' | 'critical' | 'discharged';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface ClinicalCase {
  id: string;
  patientAlias: string;
  chiefComplaint: string;
  history: string;
  examination: string;
  impression: string;
  plan: string;
  status: CaseStatus;
  taskCount: number;
  overdueTaskCount: number;
  createdAt: string;
  updatedAt: string;
  ward?: string;
  ageGroup?: string;
}

export interface ClinicalTask {
  id: string;
  caseId: string;
  patientAlias: string;
  title: string;
  completed: boolean;
  dueAt: string;
  priority: TaskPriority;
}

export interface DrugReference {
  id: string;
  name: string;
  dosage: string;
  route: string;
  notes: string;
  category: string;
}

export const mockCases: ClinicalCase[] = [
  {
    id: 'case-001',
    patientAlias: 'P.Amara',
    chiefComplaint: 'Acute chest pain, diaphoresis',
    history: 'Sudden onset chest pain radiating to left arm, 2 hours duration',
    examination: 'BP 160/100, HR 98, SpO2 96%, ECG changes in V1-V4',
    impression: 'NSTEMI — Rule out STEMI',
    plan: 'Aspirin 300mg, Clopidogrel, IV heparin, cardiology consult',
    status: 'critical',
    taskCount: 5,
    overdueTaskCount: 2,
    createdAt: '2026-05-05T08:14:00Z',
    updatedAt: '2026-05-05T14:22:00Z',
    ward: 'CCU',
    ageGroup: '55–64',
  },
  {
    id: 'case-002',
    patientAlias: 'M.Boateng',
    chiefComplaint: 'Fever, productive cough, dyspnea',
    history: '5-day history of fever, cough with yellow sputum, progressive dyspnea',
    examination: 'Temp 38.9°C, RR 24, dullness on percussion right base',
    impression: 'Community-acquired pneumonia (CAP)',
    plan: 'Amoxicillin-clavulanate, chest X-ray, sputum culture',
    status: 'active',
    taskCount: 4,
    overdueTaskCount: 1,
    createdAt: '2026-05-04T11:30:00Z',
    updatedAt: '2026-05-05T09:45:00Z',
    ward: 'Gen Med',
    ageGroup: '35–44',
  },
  {
    id: 'case-003',
    patientAlias: 'A.Mensah',
    chiefComplaint: 'Severe headache, photophobia, neck stiffness',
    history: 'Sudden onset severe headache described as "worst of life", vomiting x3',
    examination: 'Kernig positive, Brudzinski positive, temp 39.2°C',
    impression: 'Bacterial meningitis — subarachnoid hemorrhage excluded',
    plan: 'LP pending, empiric ceftriaxone + dexamethasone, neurology consult',
    status: 'critical',
    taskCount: 6,
    overdueTaskCount: 3,
    createdAt: '2026-05-05T06:00:00Z',
    updatedAt: '2026-05-05T15:10:00Z',
    ward: 'ICU',
    ageGroup: '25–34',
  },
  {
    id: 'case-004',
    patientAlias: 'K.Owusu',
    chiefComplaint: 'Type 2 DM follow-up, poor glycemic control',
    history: 'Known T2DM x 8 years, non-compliant with metformin, HbA1c 11.2%',
    examination: 'BMI 32, BP 138/88, no peripheral neuropathy signs',
    impression: 'Uncontrolled T2DM with hypertension',
    plan: 'Metformin uptitration, add amlodipine, dietitian referral',
    status: 'stable',
    taskCount: 3,
    overdueTaskCount: 0,
    createdAt: '2026-05-03T14:00:00Z',
    updatedAt: '2026-05-04T16:30:00Z',
    ward: 'OPD',
    ageGroup: '45–54',
  },
  {
    id: 'case-005',
    patientAlias: 'E.Asante',
    chiefComplaint: 'Abdominal pain, vomiting, jaundice',
    history: 'RUQ pain radiating to back, associated with fatty meals, jaundice x 2 days',
    examination: 'Murphy sign positive, scleral icterus, temp 37.8°C',
    impression: 'Acute cholecystitis with choledocholithiasis',
    plan: 'IV fluids, analgesia, surgical consult, ERCP planning',
    status: 'active',
    taskCount: 4,
    overdueTaskCount: 0,
    createdAt: '2026-05-04T20:15:00Z',
    updatedAt: '2026-05-05T11:00:00Z',
    ward: 'Surgical',
    ageGroup: '35–44',
  },
  {
    id: 'case-006',
    patientAlias: 'B.Darko',
    chiefComplaint: 'Seizure, post-ictal confusion',
    history: 'Known epileptic, missed last 2 doses of valproate, tonic-clonic x 3 min',
    examination: 'GCS 13/15, tongue bite present, urinary incontinence noted',
    impression: 'Breakthrough seizure — medication non-compliance',
    plan: 'Valproate reload IV, EEG, neurology review',
    status: 'active',
    taskCount: 3,
    overdueTaskCount: 1,
    createdAt: '2026-05-05T12:45:00Z',
    updatedAt: '2026-05-05T13:30:00Z',
    ward: 'Neuro',
    ageGroup: '25–34',
  },
  {
    id: 'case-007',
    patientAlias: 'F.Adjei',
    chiefComplaint: 'Shortness of breath, bilateral leg swelling',
    history: 'Known CHF, increasing dyspnea on exertion, orthopnea x 3 nights',
    examination: 'JVP elevated, bibasal crackles, pitting edema +3',
    impression: 'Acute decompensated heart failure',
    plan: 'IV furosemide, fluid restriction, daily weights, echo',
    status: 'stable',
    taskCount: 5,
    overdueTaskCount: 0,
    createdAt: '2026-05-02T09:00:00Z',
    updatedAt: '2026-05-05T08:00:00Z',
    ward: 'Cardiology',
    ageGroup: '65+',
  },
  {
    id: 'case-008',
    patientAlias: 'C.Nkrumah',
    chiefComplaint: 'Sickle cell pain crisis',
    history: 'Known SCD HbSS, severe bone pain in extremities and back, hydration poor',
    examination: 'Pallor ++, scleral icterus, diffuse bony tenderness',
    impression: 'Acute vaso-occlusive crisis',
    plan: 'IV morphine PCA, aggressive hydration, folate, transfusion threshold Hb<6',
    status: 'active',
    taskCount: 4,
    overdueTaskCount: 2,
    createdAt: '2026-05-05T07:30:00Z',
    updatedAt: '2026-05-05T14:00:00Z',
    ward: 'Haematology',
    ageGroup: '15–24',
  },
  {
    id: 'case-009',
    patientAlias: 'G.Tetteh',
    chiefComplaint: 'Urinary retention, lower urinary tract symptoms',
    history: 'Elderly male, progressive LUTS, nocturia x5, weak stream, PSA 8.4',
    examination: 'Enlarged prostate on DRE, benign feel, bladder palpable',
    impression: 'BPH with acute urinary retention — R/O prostate ca',
    plan: 'Urethral catheterisation, tamsulosin, urology referral',
    status: 'discharged',
    taskCount: 2,
    overdueTaskCount: 0,
    createdAt: '2026-05-03T10:00:00Z',
    updatedAt: '2026-05-05T10:00:00Z',
    ward: 'Urology',
    ageGroup: '65+',
  },
  {
    id: 'case-010',
    patientAlias: 'H.Quaye',
    chiefComplaint: 'Malaria — fever, rigors, headache',
    history: '3-day history of intermittent fever with rigors, no prophylaxis',
    examination: 'Temp 40.1°C, splenomegaly, pallor +, mRDT positive',
    impression: 'Uncomplicated Plasmodium falciparum malaria',
    plan: 'Artemether-lumefantrine, paracetamol, monitor for severity markers',
    status: 'stable',
    taskCount: 2,
    overdueTaskCount: 0,
    createdAt: '2026-05-04T16:00:00Z',
    updatedAt: '2026-05-05T07:00:00Z',
    ward: 'Infectious Disease',
    ageGroup: '25–34',
  },
];

export const mockTasks: ClinicalTask[] = [
  {
    id: 'task-001',
    caseId: 'case-001',
    patientAlias: 'P.Amara',
    title: 'Repeat ECG in 30 minutes',
    completed: false,
    dueAt: '2026-05-05T15:00:00Z',
    priority: 'high',
  },
  {
    id: 'task-002',
    caseId: 'case-001',
    patientAlias: 'P.Amara',
    title: 'Cardiology consult response',
    completed: false,
    dueAt: '2026-05-05T14:00:00Z',
    priority: 'high',
  },
  {
    id: 'task-003',
    caseId: 'case-003',
    patientAlias: 'A.Mensah',
    title: 'Lumbar puncture — awaiting coag results',
    completed: false,
    dueAt: '2026-05-05T13:30:00Z',
    priority: 'high',
  },
  {
    id: 'task-004',
    caseId: 'case-003',
    patientAlias: 'A.Mensah',
    title: 'Blood cultures x2 before antibiotics',
    completed: true,
    dueAt: '2026-05-05T07:00:00Z',
    priority: 'high',
  },
  {
    id: 'task-005',
    caseId: 'case-002',
    patientAlias: 'M.Boateng',
    title: 'Review sputum culture results',
    completed: false,
    dueAt: '2026-05-05T12:00:00Z',
    priority: 'medium',
  },
  {
    id: 'task-006',
    caseId: 'case-006',
    patientAlias: 'B.Darko',
    title: 'EEG scheduling confirmation',
    completed: false,
    dueAt: '2026-05-05T16:00:00Z',
    priority: 'medium',
  },
  {
    id: 'task-007',
    caseId: 'case-008',
    patientAlias: 'C.Nkrumah',
    title: 'Check Hb post-transfusion threshold',
    completed: false,
    dueAt: '2026-05-05T14:30:00Z',
    priority: 'high',
  },
  {
    id: 'task-008',
    caseId: 'case-008',
    patientAlias: 'C.Nkrumah',
    title: 'Pain score reassessment — PCA review',
    completed: false,
    dueAt: '2026-05-05T13:00:00Z',
    priority: 'medium',
  },
  {
    id: 'task-009',
    caseId: 'case-004',
    patientAlias: 'K.Owusu',
    title: 'Dietitian referral letter',
    completed: false,
    dueAt: '2026-05-06T09:00:00Z',
    priority: 'low',
  },
  {
    id: 'task-010',
    caseId: 'case-005',
    patientAlias: 'E.Asante',
    title: 'Surgical team review at 17:00',
    completed: false,
    dueAt: '2026-05-05T17:00:00Z',
    priority: 'medium',
  },
];

export const mockDrugs: DrugReference[] = [
  {
    id: 'drug-001',
    name: 'Artemether-Lumefantrine',
    dosage: '80/480mg twice daily x 3 days (adult)',
    route: 'Oral',
    notes: 'Take with food or milk. Monitor for QT prolongation.',
    category: 'Antimalarial',
  },
  {
    id: 'drug-002',
    name: 'Ceftriaxone',
    dosage: '2g IV once daily (meningitis: 4g/day in divided doses)',
    route: 'IV / IM',
    notes: 'Do not mix with calcium-containing solutions.',
    category: 'Antibiotic',
  },
  {
    id: 'drug-003',
    name: 'Metformin',
    dosage: '500mg–2000mg daily in divided doses',
    route: 'Oral',
    notes: 'Hold if eGFR <30. Risk of lactic acidosis.',
    category: 'Antidiabetic',
  },
  {
    id: 'drug-004',
    name: 'Furosemide',
    dosage: '40–80mg IV/oral once or twice daily',
    route: 'IV / Oral',
    notes: 'Monitor electrolytes. Ototoxic at high doses.',
    category: 'Diuretic',
  },
  {
    id: 'drug-005',
    name: 'Aspirin',
    dosage: 'Loading: 300mg. Maintenance: 75mg daily',
    route: 'Oral',
    notes: 'Avoid in peptic ulcer. Use with PPI in high-risk patients.',
    category: 'Antiplatelet',
  },
];

export const conditionDistributionData = [
  { condition: 'Infections', count: 34, fill: '#3B82F6' },
  { condition: 'Cardiovascular', count: 28, fill: '#EF4444' },
  { condition: 'Endocrine', count: 19, fill: '#F59E0B' },
  { condition: 'Neurological', count: 15, fill: '#8B5CF6' },
  { condition: 'Respiratory', count: 22, fill: '#06B6D4' },
  { condition: 'Haematology', count: 11, fill: '#10B981' },
  { condition: 'Surgical', count: 17, fill: '#F97316' },
  { condition: 'Other', count: 9, fill: '#64748B' },
];

export const casesOverTimeData = [
  { week: 'W14', cases: 4, critical: 1 },
  { week: 'W15', cases: 7, critical: 2 },
  { week: 'W16', cases: 5, critical: 0 },
  { week: 'W17', cases: 9, critical: 3 },
  { week: 'W18', cases: 6, critical: 1 },
  { week: 'W19', cases: 11, critical: 2 },
  { week: 'W20', cases: 8, critical: 1 },
  { week: 'W21', cases: 13, critical: 4 },
  { week: 'W22', cases: 10, critical: 2 },
  { week: 'W23', cases: 14, critical: 3 },
  { week: 'W24', cases: 12, critical: 2 },
  { week: 'W25', cases: 10, critical: 2 },
];