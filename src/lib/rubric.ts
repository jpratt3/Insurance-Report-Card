import type { Archetype, Goals, PillarId, PolicyLineType } from "./types";

/**
 * Benchmark values live in src/data/benchmarks/*.json, where every number carries
 * its own source and confidence. Re-exported here so existing consumers keep the
 * same import surface; reach for ./benchmarks directly when you need provenance.
 */
export {
  LINE_BANDS,
  PREMIUM_BENCHMARK,
  REQUIRED_LINES,
  LINE_BANDS_SOURCED,
  PREMIUM_BENCHMARK_SOURCED,
  REQUIRED_LINES_SOURCED,
  lineBandProvenance,
  premiumBandProvenance,
  requiredLineProvenance,
  isPresenceOnly,
  archetypeBenchmarkConfidence,
} from "./benchmarks";
export type {
  Confidence,
  Provenance,
  Benchmarked,
  BenchmarkedLineBand,
  BenchmarkedPremiumBand,
  ConfidenceSummary,
} from "./benchmarks";

/** Plain occurrence/aggregate pair, without provenance. */
export interface LineBand {
  occurrence: number;
  aggregate: number;
}

export const PILLARS: { id: PillarId; label: string; max: number }[] = [
  { id: "limits", label: "Limit adequacy vs exposures", max: 25 },
  { id: "gaps", label: "Coverage gaps and weak terms", max: 20 },
  { id: "retentions", label: "Deductibles / SIRs vs tolerance", max: 15 },
  { id: "carrier", label: "Carrier quality", max: 10 },
  { id: "claims", label: "Loss history", max: 10 },
  { id: "compliance", label: "Contract / COI compliance", max: 10 },
  { id: "cost", label: "Premium vs peers", max: 10 },
];

export function letterFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function applyKnockoutCap(
  letter: "A" | "B" | "C" | "D" | "F",
  knockoutCount: number,
): "A" | "B" | "C" | "D" | "F" {
  if (knockoutCount >= 2) return "F";
  if (knockoutCount === 1) {
    const order = ["A", "B", "C", "D", "F"] as const;
    return order[Math.max(order.indexOf(letter), order.indexOf("D"))];
  }
  return letter;
}

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  clinics: "Multi-site clinics",
  home_health: "Home health / pediatric therapy",
  imaging: "Diagnostic imaging",
  field_software: "Field service + software",
  saas: "SaaS / AI / IT services",
  energy: "Energy services",
  nonprofit: "Nonprofit",
  holdco: "Holdco / SPAC",
};

export const DEFAULT_GOALS: Goals = {
  minUmbrella: 5_000_000,
  minCyber: 2_000_000,
  minDo: 3_000_000,
  minProfessional: 1_000_000,
  minTechEo: 2_000_000,
  minAmBest: "A-",
  maxSir: 50_000,
};

export const SAAS_DEFAULT_GOALS: Goals = {
  ...DEFAULT_GOALS,
  minUmbrella: 1_000_000,
  minCyber: 5_000_000,
  minTechEo: 5_000_000,
};

export const HOLDCO_DEFAULT_GOALS: Goals = {
  ...DEFAULT_GOALS,
  minUmbrella: 0,
  minCyber: 0,
  minDo: 5_000_000,
};

export const NONPROFIT_DEFAULT_GOALS: Goals = {
  ...DEFAULT_GOALS,
  minUmbrella: 1_000_000,
  minCyber: 1_000_000,
  minDo: 1_000_000,
};

export function defaultGoalsFor(archetype: Archetype): Goals {
  if (archetype === "saas") return { ...SAAS_DEFAULT_GOALS };
  if (archetype === "holdco") return { ...HOLDCO_DEFAULT_GOALS };
  if (archetype === "nonprofit") return { ...NONPROFIT_DEFAULT_GOALS };
  return { ...DEFAULT_GOALS };
}

const AM_BEST_RANK: Record<string, number> = {
  "A++": 10,
  "A+": 9,
  A: 8,
  "A-": 7,
  "B++": 6,
  "B+": 5,
  B: 4,
  "B-": 3,
};

export function amBestRank(rating: string): number {
  return AM_BEST_RANK[rating] ?? 0;
}

export function meetsAmBestFloor(rating: string, floor: string): boolean {
  return amBestRank(rating) >= amBestRank(floor);
}

export const LINE_LABEL: Record<PolicyLineType, string> = {
  gl: "General liability",
  property: "Property",
  auto: "Commercial auto",
  hnoa: "Hired / non-owned auto",
  wc: "Workers compensation",
  umbrella: "Umbrella / excess",
  professional: "Professional / malpractice",
  abuse: "Abuse & molestation",
  cyber: "Cyber",
  do: "Directors & officers",
  epli: "Employment practices",
  crime: "Crime",
  tech_eo: "Tech E&O",
  inland_marine: "Inland marine / tools",
  pollution: "Pollution",
  fiduciary: "Fiduciary",
};

export const PM_TEMPLATES: {
  id: "clinic" | "field" | "saas";
  label: string;
  archetype: Archetype;
  blurb: string;
}[] = [
  { id: "clinic", label: "Clinic", archetype: "clinics", blurb: "Outpatient / professional / PHI" },
  { id: "field", label: "Field + software", archetype: "field_software", blurb: "Techs on site, auto, umbrella" },
  { id: "saas", label: "SaaS / AI", archetype: "saas", blurb: "E&O and cyber are the economic lines" },
];

export function templateForArchetype(archetype: Archetype): "clinic" | "field" | "saas" {
  if (archetype === "field_software" || archetype === "energy") return "field";
  if (archetype === "saas" || archetype === "holdco") return "saas";
  return "clinic";
}

/** v0 capacity formula: min(1% cash, 5% EBITDA, industry ceiling). */
export function deriveMaxSir(archetype: Archetype, cash: number, ebitda: number): number {
  const fromCash = cash > 0 ? cash * 0.01 : Number.POSITIVE_INFINITY;
  const fromEbitda = ebitda > 0 ? ebitda * 0.05 : Number.POSITIVE_INFINITY;
  const raw = Math.min(fromCash, fromEbitda);
  const clinicLike = archetype === "clinics" || archetype === "home_health" || archetype === "imaging";
  const ceiling = clinicLike ? 25_000 : 50_000;
  const floor = 5_000;
  if (!Number.isFinite(raw)) return ceiling;
  return Math.round(Math.min(ceiling, Math.max(floor, raw)));
}
