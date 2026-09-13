import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from "fs";
import { join } from "path";
import type { Company, DocumentType, Exposures, UploadedDocument } from "./types";
import { defaultGoalsFor, deriveMaxSir, PM_TEMPLATES } from "./rubric";
import { slugify } from "./inputs";

export { slugify };
import type { Archetype } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

type DbShape = { companies: Company[] };

export function emptyExposures(partial: Partial<Exposures> = {}): Exposures {
  return {
    revenue: 0,
    payroll: 0,
    employees: 0,
    locations: 0,
    vehicles: 0,
    tiv: 0,
    hasPhi: false,
    hasCustomerData: false,
    cash: 0,
    maxDeductible: 0,
    contractMinUmbrella: 0,
    contractMinCyber: 0,
    contractMinEo: 0,
    largestWire: 0,
    yearsInBusiness: 0,
    emr: null,
    ebitda: 0,
    notes: "",
    ...partial,
  };
}


export function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

let memory: DbShape | null = null;

function ensure(): DbShape {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    const initial: DbShape = { companies: [] };
    writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    memory = initial;
    return initial;
  }
  try {
    const raw = readFileSync(DB_PATH, "utf8").trim();
    if (!raw) return memory ?? { companies: [] };
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed || !Array.isArray(parsed.companies)) return memory ?? { companies: [] };
    memory = parsed;
    return parsed;
  } catch (err) {
    console.error("db.json read failed", err);
    if (memory) return memory;
    throw err;
  }
}

function save(db: DbShape) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  memory = db;
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function listCompanies(): Company[] {
  return ensure().companies;
}

export function getCompany(id: string): Company | undefined {
  return ensure().companies.find((c) => c.id === id);
}

export function addCompany(input: {
  name: string;
  template: "clinic" | "field" | "saas";
  cash: number;
  ebitda: number;
  revenue: number;
  login?: { username: string; password: string };
}): Company {
  const t = PM_TEMPLATES.find((x) => x.id === input.template) ?? PM_TEMPLATES[0];
  const archetype: Archetype = t.archetype;
  const db = ensure();
  const id = uniqueId(slugify(input.name), db.companies.map((c) => c.id));
  const exposures = emptyExposures({
    cash: input.cash,
    ebitda: input.ebitda,
    revenue: input.revenue,
    maxDeductible: deriveMaxSir(archetype, input.cash, input.ebitda),
  });
  const company: Company = {
    id,
    name: input.name.trim(),
    status: "Active",
    partnered: String(new Date().getFullYear()),
    sector: t.label,
    hq: "",
    leadership: "",
    archetype,
    exposures,
    goals: {
      ...defaultGoalsFor(archetype),
      maxSir: deriveMaxSir(archetype, input.cash, input.ebitda),
    },
    policies: [],
    documents: [],
    ...(input.login ? { login: input.login } : {}),
  };
  db.companies.push(company);
  save(db);
  return company;
}

export function updateCompany(id: string, patch: Partial<Company>): Company | undefined {
  const db = ensure();
  const i = db.companies.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  db.companies[i] = { ...db.companies[i], ...patch, id };
  save(db);
  return db.companies[i];
}

export function addDocument(id: string, doc: UploadedDocument): Company | undefined {
  const c = getCompany(id);
  if (!c) return undefined;
  return updateCompany(id, { documents: [...c.documents, doc] });
}

export function removeDocument(companyId: string, docId: string): Company | undefined {
  const c = getCompany(companyId);
  if (!c) return undefined;
  const doc = c.documents.find((d) => d.id === docId);
  if (!doc) return c;
  if (doc.storedPath && existsSync(doc.storedPath)) {
    try {
      unlinkSync(doc.storedPath);
    } catch {
      // Keep the record removal even if OneDrive/file lock blocks unlink.
    }
  }
  let updated = updateCompany(companyId, { documents: c.documents.filter((d) => d.id !== docId) });
  if (
    updated &&
    doc.type === "schedule_of_insurance" &&
    !updated.documents.some((d) => d.type === "schedule_of_insurance")
  ) {
    updated = updateCompany(companyId, {
      policies: updated.policies.filter((p) => p.source !== "soi"),
    });
  }
  return updated;
}

export function replaceSoiPolicies(companyId: string, soiPolicies: Company["policies"]): Company | undefined {
  const c = getCompany(companyId);
  if (!c) return undefined;
  const kept = c.policies.filter((p) => p.source !== "soi");
  return updateCompany(companyId, { policies: [...kept, ...soiPolicies] });
}

/** Empties the book and deletes every stored upload. */
export function resetDb(): Company[] {
  const initial: DbShape = { companies: [] };
  save(initial);
  const uploads = join(DATA_DIR, "uploads");
  if (existsSync(uploads)) rmSync(uploads, { recursive: true, force: true });
  return initial.companies;
}

export function replaceCompanies(companies: Company[]): Company[] {
  save({ companies });
  return companies;
}

export function guessKind(filename: string): DocumentType {
  const f = filename.toLowerCase();
  if (f.includes("exposure") || f.includes("acord") || f.includes("application") || f.includes("headcount") || f.includes("fleet")) {
    return "exposure_pack";
  }
  if (f.includes("balance") || f.includes("10-q") || f.includes("10-k")) return "balance_sheet";
  if (f.includes("p&l") || f.includes("pnl") || f.includes("income") || f.includes("ebitda")) {
    return "income_statement";
  }
  if (f.includes("cash flow") || f.includes("cashflow")) return "cash_flow";
  if (f.includes("board") || f.includes("reporting pack") || f.includes("monthly")) return "reporting_pack";
  if (f.includes("financial") || f.includes("statement")) return "financials";
  if (f.includes("loss")) return "loss_runs";
  if (f.includes("emr") || f.includes("mod")) return "wc_emr";
  if (f.includes("endorse")) return "endorsement";
  if (f.includes("sov") || f.includes("value")) return "sov";
  if (f.includes("coi") || f.includes("exhibit") || f.includes("msa")) return "contract_exhibit";
  if (f.includes("cyber")) return "cyber_binder";
  if (f.includes("d&o") || f.includes("directors")) return "do_binder";
  if (f.includes("prof") || f.includes("malp")) return "professional_binder";
  if (f.includes("schedule")) return "schedule_of_insurance";
  if (f.includes("dec") || f.includes("binder")) return "binder_or_dec";
  return "other";
}
