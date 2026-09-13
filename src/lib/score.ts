import { DOCUMENT_LABEL, requiredIntakeDocuments } from "./inputs";
import {
  ARCHETYPE_LABEL,
  LINE_BANDS,
  LINE_LABEL,
  PILLARS,
  PREMIUM_BENCHMARK,
  REQUIRED_LINES,
  amBestRank,
  applyKnockoutCap,
  letterFromScore,
  meetsAmBestFloor,
} from "./rubric";
import type {
  Company,
  DataConfidence,
  Flag,
  KnockoutResult,
  PolicyLine,
  PolicyLineType,
  ScoreRun,
} from "./types";

function hasLine(company: Company, line: PolicyLineType): boolean {
  if (line === "auto") {
    return company.policies.some((p) => p.line === "auto" || p.line === "hnoa");
  }
  return company.policies.some((p) => p.line === line);
}

function bestLine(company: Company, line: PolicyLineType): PolicyLine | undefined {
  const matches = company.policies.filter((p) => {
    if (line === "auto") return p.line === "auto" || p.line === "hnoa";
    return p.line === line;
  });
  return matches.sort((a, b) => b.limitOccurrence - a.limitOccurrence)[0];
}

function linesFor(company: Company): PolicyLineType[] {
  return REQUIRED_LINES[company.archetype] ?? [];
}

function requiredLimit(company: Company, line: PolicyLineType): number {
  const band = LINE_BANDS[company.archetype]?.[line]?.occurrence ?? 0;
  const { goals, exposures } = company;
  let goal = 0;
  if (line === "umbrella") goal = Math.max(goals.minUmbrella, exposures.contractMinUmbrella);
  if (line === "cyber") goal = Math.max(goals.minCyber, exposures.contractMinCyber);
  if (line === "do") goal = goals.minDo;
  if (line === "professional") goal = Math.max(goals.minProfessional, exposures.contractMinEo);
  if (line === "tech_eo") goal = Math.max(goals.minTechEo, exposures.contractMinEo);
  return Math.max(band, goal);
}

function limitRatio(actual: number, required: number): number {
  if (required <= 0) return 1;
  if (actual >= required) return 1;
  if (actual >= required * 0.5) return 0.55;
  if (actual > 0) return 0.25;
  return 0;
}

function evaluateKnockouts(company: Company): KnockoutResult[] {
  const e = company.exposures;
  const professionalNeeded = ["clinics", "home_health", "imaging"].includes(company.archetype);
  const claimsMade = company.policies.filter((p) =>
    ["professional", "do", "cyber", "tech_eo"].includes(p.line),
  );
  const retroGap = claimsMade.some((p) => {
    if (!p.retroDate) return e.yearsInBusiness >= 3;
    const year = Number(p.retroDate.slice(0, 4));
    if (!Number.isFinite(year)) return false;
    return new Date().getFullYear() - year < e.yearsInBusiness - 1;
  });
  const umbrella = bestLine(company, "umbrella");

  return [
    {
      id: "wc",
      label: "Employees on payroll with no workers compensation",
      triggered: e.employees > 0 && company.archetype !== "holdco" && !hasLine(company, "wc"),
    },
    {
      id: "professional",
      label: "Clinic / home health / imaging with no professional / malpractice",
      triggered: professionalNeeded && !hasLine(company, "professional"),
    },
    {
      id: "cyber",
      label: "PHI or customer data with no standalone cyber",
      triggered: (e.hasPhi || e.hasCustomerData) && !hasLine(company, "cyber"),
    },
    {
      id: "auto",
      label: "Vehicles in use with no auto or hired/non-owned auto",
      triggered: e.vehicles > 0 && !hasLine(company, "auto") && !hasLine(company, "hnoa"),
    },
    {
      id: "retro",
      label: "Claims-made professional / D&O / cyber with a retro gap vs years in business",
      triggered: retroGap && claimsMade.length > 0,
    },
    {
      id: "tower",
      label: "Umbrella that does not attach to the primary (tower hole)",
      triggered: Boolean(umbrella?.umbrellaGap),
    },
  ];
}

function scoreLimits(company: Company): { points: number; flags: Flag[] } {
  const required = linesFor(company).filter((line) => {
    if (line === "property") return company.exposures.tiv > 0 || company.exposures.locations > 0;
    if (line === "hnoa" || line === "auto") return true;
    return true;
  });
  const flags: Flag[] = [];
  let sum = 0;
  for (const line of required) {
    const need = requiredLimit(company, line);
    if (need <= 0 && line === "property") {
      sum += 1;
      continue;
    }
    const pol = bestLine(company, line);
    const actual = pol?.limitOccurrence ?? 0;
    const ratio = limitRatio(actual, need);
    sum += ratio;
    if (!pol) {
      flags.push({ severity: "red", text: `Missing ${LINE_LABEL[line]}` });
    } else if (ratio < 1 && need > 1) {
      flags.push({
        severity: ratio < 0.5 ? "red" : "yellow",
        text: `${LINE_LABEL[line]} is $${actual.toLocaleString()} vs $${need.toLocaleString()} required (band / goals / contract)`,
      });
    }
  }
  const avg = required.length ? sum / required.length : 1;
  return { points: Math.round(avg * 25), flags };
}

function scoreGaps(company: Company): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  let pts = 20;
  for (const line of linesFor(company)) {
    if (!hasLine(company, line)) {
      pts -= 4;
      flags.push({ severity: "red", text: `Required line not on program: ${LINE_LABEL[line]}` });
    }
  }
  const cyber = bestLine(company, "cyber");
  if (cyber) {
    const seNeed = Math.max(250_000, company.exposures.largestWire || 0);
    if (cyber.socialEngineeringLimit != null && cyber.socialEngineeringLimit < seNeed) {
      pts -= 3;
      flags.push({
        severity: "yellow",
        text: `Cyber social-engineering sublimit $${cyber.socialEngineeringLimit.toLocaleString()} is below typical wire / $250,000 floor`,
      });
    }
    if (cyber.waitingHours != null && cyber.waitingHours > 12) {
      pts -= 2;
      flags.push({
        severity: "yellow",
        text: `Cyber business-interruption waiting period is ${cyber.waitingHours} hours (target ≤ 12)`,
      });
    }
  }
  const umbrella = bestLine(company, "umbrella");
  if (umbrella && company.archetype === "saas" && (bestLine(company, "cyber")?.limitOccurrence ?? 0) < requiredLimit(company, "cyber")) {
    flags.push({
      severity: "yellow",
      text: "Umbrella does not sit over cyber / E&O — specialty excess is required for MSA cyber limits",
    });
  }
  return { points: Math.max(0, pts), flags };
}

function scoreRetentions(company: Company): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  const cap = Math.min(company.goals.maxSir, company.exposures.maxDeductible || company.goals.maxSir);
  const overs = company.policies.filter((p) => cap > 0 && p.retention > cap && p.line !== "wc");
  if (!overs.length) return { points: 15, flags };
  const worst = Math.max(...overs.map((p) => p.retention / cap));
  overs.forEach((p) =>
    flags.push({
      severity: "yellow",
      text: `${LINE_LABEL[p.line]} retention $${p.retention.toLocaleString()} exceeds tolerance $${cap.toLocaleString()}`,
    }),
  );
  const pts = worst > 3 ? 4 : worst > 1.5 ? 8 : 11;
  return { points: pts, flags };
}

function scoreCarrier(company: Company): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  if (!company.policies.length) return { points: 0, flags: [{ severity: "red", text: "No carriers on file" }] };
  const bad = company.policies.filter((p) => !meetsAmBestFloor(p.amBest, company.goals.minAmBest));
  const minRank = Math.min(...company.policies.map((p) => amBestRank(p.amBest)));
  if (bad.length) {
    flags.push({
      severity: "yellow",
      text: `${bad.length} line(s) below ${company.goals.minAmBest} AM Best floor`,
    });
  }
  if (minRank >= 7) return { points: 10, flags };
  if (minRank >= 5) return { points: 6, flags };
  return { points: 3, flags };
}

/**
 * Claims splits into evidence (4) and performance (6). Withheld data scores at or
 * below a reported-but-mediocre result, so a CFO never gains by not sending the
 * mod — the old `emr == null -> 7` made silence the highest-scoring answer.
 */
function scoreClaims(company: Company, hasLossRuns: boolean): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  let points = 0;

  if (hasLossRuns) {
    points += 4;
  } else {
    flags.push({ severity: "red", text: "No loss runs on file — claims history is unverified" });
  }

  // WC is not the economic exposure for these archetypes, so an absent mod is
  // less damning — but it still must not outscore a reported one.
  const wcSecondary = ["saas", "holdco", "nonprofit"].includes(company.archetype);
  const emr = company.exposures.emr;

  if (emr == null) {
    points += wcSecondary ? 3 : 1;
    flags.push({
      severity: wcSecondary ? "yellow" : "red",
      text: "WC experience mod not supplied — scored as unverified, not as clean",
    });
  } else if (emr <= 0.9) {
    points += 6;
  } else if (emr <= 1.0) {
    points += 5;
  } else if (emr <= 1.15) {
    points += 3;
    flags.push({ severity: "yellow", text: `WC experience mod ${emr.toFixed(2)} is above 1.00` });
  } else if (emr <= 1.25) {
    points += 2;
    flags.push({ severity: "red", text: `WC experience mod ${emr.toFixed(2)} is elevated` });
  } else {
    flags.push({ severity: "red", text: `WC experience mod ${emr.toFixed(2)} is elevated` });
  }

  return { points, flags };
}

function scoreCompliance(company: Company): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  if (company.archetype === "holdco") return { points: 8, flags };
  const gl = bestLine(company, "gl");
  if (!gl) return { points: 2, flags: [{ severity: "red", text: "No GL to evidence additional insured / PNC / waiver" }] };
  let pts = 0;
  if (gl.additionalInsured) pts += 4;
  else flags.push({ severity: "yellow", text: "GL missing additional insured" });
  if (gl.primaryNonContributory) pts += 3;
  else flags.push({ severity: "yellow", text: "GL missing primary & non-contributory" });
  if (gl.waiverSubrogation) pts += 3;
  else flags.push({ severity: "yellow", text: "GL missing waiver of subrogation" });
  return { points: pts, flags };
}

function scoreCost(company: Company): { points: number; flags: Flag[] } {
  const flags: Flag[] = [];
  const prem = company.policies.reduce((s, p) => s + p.premium, 0);

  if (!company.exposures.revenue) {
    flags.push({
      severity: "red",
      text: "No revenue on file — premium cannot be compared to the peer band",
    });
    return { points: 3, flags };
  }

  const band = PREMIUM_BENCHMARK[company.archetype];
  if (!band) {
    flags.push({ severity: "yellow", text: "No peer premium band for this template" });
    return { points: 5, flags };
  }
  const pct = prem / company.exposures.revenue;
  const asPct = (v: number) => `${(v * 100).toFixed(1)}%`;

  // Spend far below the band is normally missing coverage, not efficiency.
  if (pct < band.good * 0.4) {
    flags.push({
      severity: "yellow",
      text: `Premium is ${asPct(pct)} of revenue against a ${asPct(band.good)} peer band — well below peers usually means lines or limits are missing, not that the program is cheap`,
    });
    return { points: 6, flags };
  }

  if (pct <= band.good) return { points: 10, flags };

  if (pct <= band.watch) {
    flags.push({
      severity: "yellow",
      text: `Premium is ${asPct(pct)} of revenue, above the ${asPct(band.good)} peer band for ${ARCHETYPE_LABEL[company.archetype].toLowerCase()}`,
    });
    return { points: 7, flags };
  }

  flags.push({
    severity: "red",
    text: `Premium is ${asPct(pct)} of revenue against a ${asPct(band.good)} peer band — ${(pct / band.good).toFixed(1)}× peers`,
  });
  return { points: pct <= band.watch * 1.5 ? 4 : 2, flags };
}

/**
 * What the engine had to guess at. Surfaced next to the letter so a PM can tell a
 * clean B from a B that rests on three unverified inputs.
 */
function assessDataConfidence(
  company: Company,
  documentsReceived: number,
  documentsRequired: number,
): DataConfidence {
  const e = company.exposures;
  const have = new Set(company.documents.map((d) => d.type));
  const unverifiedInputs: string[] = [];

  if (!company.policies.length) unverifiedInputs.push("No policy lines extracted");
  if (!have.has("loss_runs")) unverifiedInputs.push("Loss runs");
  if (e.emr == null) unverifiedInputs.push("WC experience mod");
  if (!e.revenue) unverifiedInputs.push("Revenue");
  if (!e.cash && !e.ebitda) unverifiedInputs.push("Cash / EBITDA (max SIR is a default)");
  if (!e.yearsInBusiness) unverifiedInputs.push("Years in business (retro-date test)");

  const coverage = documentsRequired ? documentsReceived / documentsRequired : 1;
  return {
    documentsReceived,
    documentsRequired,
    unverifiedInputs,
    provisional: coverage < 0.6 || unverifiedInputs.length >= 3,
  };
}

export function scoreCompany(company: Company): ScoreRun {
  const hasLossRuns = company.documents.some((d) => d.type === "loss_runs");
  const knockouts = evaluateKnockouts(company);
  const knockoutCount = knockouts.filter((k) => k.triggered).length;
  const limits = scoreLimits(company);
  const gaps = scoreGaps(company);
  const retentions = scoreRetentions(company);
  const carrier = scoreCarrier(company);
  const claims = scoreClaims(company, hasLossRuns);
  const compliance = scoreCompliance(company);
  const cost = scoreCost(company);

  const pillarFns = { limits, gaps, retentions, carrier, claims, compliance, cost };
  const pillars = PILLARS.map((p) => ({
    ...p,
    points: pillarFns[p.id].points,
  }));
  const rawTotal = pillars.reduce((s, p) => s + p.points, 0);
  const letterFromMath = letterFromScore(rawTotal);
  const letter = applyKnockoutCap(letterFromMath, knockoutCount);

  const flags = [
    ...limits.flags,
    ...gaps.flags,
    ...retentions.flags,
    ...carrier.flags,
    ...claims.flags,
    ...compliance.flags,
    ...cost.flags,
  ];
  knockouts
    .filter((k) => k.triggered)
    .forEach((k) => flags.unshift({ severity: "red", text: `Knockout: ${k.label}` }));

  const uniq = flags.filter((f, i) => flags.findIndex((x) => x.text === f.text) === i);
  const talkingPoints = uniq.slice(0, 8).map((f) => f.text);

  const needed = requiredIntakeDocuments(company);
  const have = new Set(company.documents.map((d) => d.type));
  const missingDocuments = needed
    .filter((t) => !have.has(t))
    .map((type) => ({ type, label: DOCUMENT_LABEL[type] }));
  const receivedDocuments = needed
    .filter((t) => have.has(t))
    .map((type) => ({ type, label: DOCUMENT_LABEL[type] }));

  return {
    scoredAt: new Date().toISOString(),
    rawTotal,
    letterFromMath,
    letter,
    knockoutCount,
    knockouts,
    pillars,
    flags: uniq,
    talkingPoints,
    missingDocuments,
    receivedDocuments,
    dataConfidence: assessDataConfidence(company, receivedDocuments.length, needed.length),
  };
}
