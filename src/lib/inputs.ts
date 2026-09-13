import type { Archetype, DocumentType } from "./types";

/** Company id / default CFO username: lowercase, hyphenated, ascii. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || `co-${Date.now()}`;
}

export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  schedule_of_insurance: "Schedule of insurance",
  binder_or_dec: "Policies / endorsements",
  endorsement: "Endorsements",
  loss_runs: "Loss runs (5 years or first-year attestation)",
  wc_emr: "Workers comp EMR worksheet",
  professional_binder: "Professional / malpractice binder",
  cyber_binder: "Cyber binder (full insuring-agreement grid)",
  do_binder: "D&O binder (Side A/B/C + retro)",
  contract_exhibit: "Customer / landlord insurance exhibit or COI sample",
  sov: "Statement of values / property schedule",
  financials: "Financial statements",
  income_statement: "Income statement / P&L",
  balance_sheet: "Balance sheet",
  cash_flow: "Cash flow statement",
  reporting_pack: "Board / monthly reporting pack",
  exposure_pack: "Exposure / application documents",
  other: "Other",
};

export const PM_SETUP_DOCUMENTS: {
  type: DocumentType;
  label: string;
  hint: string;
  required: boolean;
}[] = [
  {
    type: "income_statement",
    label: "Income statement / P&L",
    hint: "Revenue and EBITDA",
    required: true,
  },
  {
    type: "balance_sheet",
    label: "Balance sheet",
    hint: "Cash / liquidity",
    required: true,
  },
  {
    type: "cash_flow",
    label: "Cash flow statement",
    hint: "",
    required: false,
  },
  {
    type: "reporting_pack",
    label: "Board / monthly reporting pack",
    hint: "",
    required: false,
  },
];

export function isPmFinancial(type: string): boolean {
  return PM_SETUP_DOCUMENTS.some((d) => d.type === type) || type === "financials";
}

const ALWAYS: DocumentType[] = [
  "schedule_of_insurance",
  "binder_or_dec",
  "endorsement",
  "loss_runs",
];

const BY_ARCHETYPE: Record<Archetype, DocumentType[]> = {
  clinics: [...ALWAYS, "professional_binder", "cyber_binder", "do_binder", "sov", "contract_exhibit", "wc_emr"],
  home_health: [...ALWAYS, "professional_binder", "cyber_binder", "do_binder", "contract_exhibit", "wc_emr"],
  imaging: [...ALWAYS, "professional_binder", "cyber_binder", "do_binder", "sov", "wc_emr"],
  field_software: [...ALWAYS, "cyber_binder", "do_binder", "contract_exhibit", "wc_emr"],
  saas: [...ALWAYS, "cyber_binder", "do_binder", "contract_exhibit"],
  energy: [...ALWAYS, "do_binder", "wc_emr", "sov"],
  nonprofit: [...ALWAYS, "do_binder", "cyber_binder"],
  holdco: ["binder_or_dec", "endorsement", "do_binder", "loss_runs"],
};

export function requiredDocuments(archetype: Archetype): DocumentType[] {
  return BY_ARCHETYPE[archetype] ?? ALWAYS;
}

export const INTAKE_GROUPS: { id: string; label: string; types: DocumentType[] }[] = [
  {
    id: "policy",
    label: "Policy information",
    types: ["schedule_of_insurance", "sov"],
  },
  {
    id: "claims",
    label: "Claims and experience",
    types: ["loss_runs", "wc_emr"],
  },
  {
    id: "contracts",
    label: "Contracts and certificates",
    types: ["contract_exhibit"],
  },
];

export function intakeGroupsFor(archetype: Archetype) {
  const needed = new Set(requiredDocuments(archetype));
  needed.add("schedule_of_insurance");
  return INTAKE_GROUPS.map((group) => ({
    ...group,
    types: group.types.filter((type) => needed.has(type)),
  })).filter((group) => group.types.length > 0);
}

const POLICY_FILE_TYPES: DocumentType[] = [
  "binder_or_dec",
  "endorsement",
  "professional_binder",
  "cyber_binder",
  "do_binder",
];

export function hasScheduleOfInsurance(documents: { type: string }[]): boolean {
  return documents.some((d) => d.type === "schedule_of_insurance");
}

export function requiredIntakeDocuments(company: {
  archetype: Archetype;
  documents: { type: string }[];
}): DocumentType[] {
  const fromTemplate = requiredDocuments(company.archetype).filter(
    (t) => t !== "schedule_of_insurance" && !POLICY_FILE_TYPES.includes(t),
  );
  if (!hasScheduleOfInsurance(company.documents)) {
    return ["binder_or_dec", ...fromTemplate];
  }
  return fromTemplate;
}

export const EXPOSURE_FIELDS = [
  { key: "revenue", label: "Revenue ($)", hint: "Trailing twelve months" },
  { key: "payroll", label: "Payroll ($)", hint: "Used with WC" },
  { key: "employees", label: "Employees", hint: "W-2 headcount" },
  { key: "locations", label: "Locations", hint: "Clinics, offices, yards" },
  { key: "vehicles", label: "Owned / long-term leased vehicles", hint: "0 if HNOA only" },
  { key: "tiv", label: "Total insured value ($)", hint: "Property / equipment" },
  { key: "cash", label: "Cash / liquidity ($)", hint: "Retention capacity" },
  { key: "ebitda", label: "EBITDA ($)", hint: "Used with cash to set max SIR" },
  { key: "maxDeductible", label: "Max deductible you can take ($)", hint: "Stated risk tolerance" },
  { key: "contractMinUmbrella", label: "Highest contract umbrella minimum ($)", hint: "0 if unknown" },
  { key: "contractMinCyber", label: "Highest contract cyber minimum ($)", hint: "0 if unknown" },
  { key: "contractMinEo", label: "Highest contract E&O / professional minimum ($)", hint: "0 if unknown" },
  { key: "largestWire", label: "Largest typical wire / AP run ($)", hint: "Social engineering check" },
  { key: "yearsInBusiness", label: "Years in business", hint: "Retro-date test" },
  { key: "emr", label: "Current WC experience mod", hint: "Blank if unknown / N/A" },
] as const;

