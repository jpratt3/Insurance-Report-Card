export type CompanyStatus = "Active" | "Realized" | "Give-Back";

export type Archetype =
  | "clinics"
  | "home_health"
  | "imaging"
  | "field_software"
  | "saas"
  | "energy"
  | "nonprofit"
  | "holdco";

export type PolicyLineType =
  | "gl"
  | "property"
  | "auto"
  | "hnoa"
  | "wc"
  | "umbrella"
  | "professional"
  | "abuse"
  | "cyber"
  | "do"
  | "epli"
  | "crime"
  | "tech_eo"
  | "inland_marine"
  | "pollution"
  | "fiduciary";

export type DocumentType =
  | "schedule_of_insurance"
  | "binder_or_dec"
  | "loss_runs"
  | "wc_emr"
  | "professional_binder"
  | "cyber_binder"
  | "do_binder"
  | "contract_exhibit"
  | "sov"
  | "endorsement"
  | "financials"
  | "income_statement"
  | "balance_sheet"
  | "cash_flow"
  | "reporting_pack"
  | "exposure_pack"
  | "other";

export type PillarId =
  | "limits"
  | "gaps"
  | "retentions"
  | "carrier"
  | "claims"
  | "compliance"
  | "cost";

export interface Exposures {
  revenue: number;
  payroll: number;
  employees: number;
  locations: number;
  vehicles: number;
  tiv: number;
  hasPhi: boolean;
  hasCustomerData: boolean;
  cash: number;
  maxDeductible: number;
  contractMinUmbrella: number;
  contractMinCyber: number;
  contractMinEo: number;
  largestWire: number;
  yearsInBusiness: number;
  emr: number | null;
  ebitda: number;
  notes: string;
}

export interface Goals {
  minUmbrella: number;
  minCyber: number;
  minDo: number;
  minProfessional: number;
  minTechEo: number;
  minAmBest: string;
  maxSir: number;
}

export interface PolicyLine {
  id: string;
  line: PolicyLineType;
  carrier: string;
  amBest: string;
  limitOccurrence: number;
  limitAggregate: number;
  retention: number;
  premium: number;
  retroDate: string | null;
  waitingHours: number | null;
  socialEngineeringLimit: number | null;
  additionalInsured: boolean;
  primaryNonContributory: boolean;
  waiverSubrogation: boolean;
  attachesOver: PolicyLineType[];
  umbrellaGap: boolean;
  notes: string;
  source?: "soi" | "binder" | "manual";
}

export interface UploadedDocument {
  id: string;
  type: DocumentType;
  filename: string;
  storedPath: string;
  uploadedAt: string;
  extractConfidence: number | null;
  extractNotes: string;
  policyId?: string | null;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  partnered: string;
  sector: string;
  hq: string;
  leadership: string;
  archetype: Archetype;
  sample?: boolean;
  /** CFO portal credentials the PM set at intake. Absent on legacy rows. */
  login?: { username: string; password: string };
  exposures: Exposures;
  goals: Goals;
  policies: PolicyLine[];
  documents: UploadedDocument[];
}

export interface KnockoutResult {
  id: string;
  label: string;
  triggered: boolean;
}

export interface Flag {
  severity: "red" | "yellow";
  text: string;
}

export interface PillarScore {
  id: PillarId;
  label: string;
  max: number;
  points: number;
}

export interface DataConfidence {
  documentsReceived: number;
  documentsRequired: number;
  /** Scoring inputs that were absent and had to be scored as unverified. */
  unverifiedInputs: string[];
  /** True when too little evidence is on file to treat the letter as settled. */
  provisional: boolean;
}

export interface ScoreRun {
  scoredAt: string;
  rawTotal: number;
  letterFromMath: "A" | "B" | "C" | "D" | "F";
  letter: "A" | "B" | "C" | "D" | "F";
  knockoutCount: number;
  knockouts: KnockoutResult[];
  pillars: PillarScore[];
  flags: Flag[];
  talkingPoints: string[];
  missingDocuments: { type: DocumentType; label: string }[];
  receivedDocuments: { type: DocumentType; label: string }[];
  dataConfidence: DataConfidence;
}

export interface StoreFile {
  companies: Company[];
  scores: Record<string, ScoreRun>;
}
