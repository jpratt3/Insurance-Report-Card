import { extractTextFromUpload } from "./soi";
import { parseUsd } from "./money";

export type FinancialField = "cash" | "ebitda" | "revenue";

export type FinancialHit = {
  value: number;
  label: string;
  source: string;
};

export type FinancialExtract = Partial<Record<FinancialField, FinancialHit>>;

type Rule = {
  field: FinancialField;
  /** Higher wins when two rows both match. */
  priority: number;
  match: RegExp;
};

/**
 * Ordered strongest-to-weakest. A statement usually spells the figure out
 * ("Net program revenue", "Cash and cash equivalents"); the loose fallbacks
 * catch a board pack that just says "Revenue".
 */
const RULES: Rule[] = [
  { field: "revenue", priority: 5, match: /^(net program revenue|total (net )?revenue|net revenues?|total (net )?sales)\b/i },
  { field: "revenue", priority: 4, match: /^(revenue|revenues|sales|gross revenue|net sales)\b/i },
  { field: "revenue", priority: 3, match: /\b(net program revenue|total revenue)\b/i },

  { field: "ebitda", priority: 5, match: /^(adjusted ebitda|ebitda)\b/i },
  { field: "ebitda", priority: 3, match: /\bebitda\b/i },

  { field: "cash", priority: 5, match: /^cash and cash equivalents\b/i },
  { field: "cash", priority: 4, match: /^(cash end of year|cash at end of (the )?(year|period)|ending cash)\b/i },
  { field: "cash", priority: 3, match: /^(cash|cash on hand|total cash)\b/i },
];

/** Rows that look like a match but are the wrong number. */
const REJECT = [
  /cost of|expense|margin|per share|% of|percent|forecast|budget|target|prior year only/i,
  /change in cash|net change|beginning of (the )?year|beginning cash|cash flow from|cash from|cash used/i,
  /ebitda margin|ebitda %|multiple|adjustments? to ebitda/i,
  /deferred revenue|unearned revenue|revenue per|accrued revenue/i,
];

const MULTIPLIER = [
  { pattern: /\bin (thousands|000s)\b|\(\s*\$?\s*(in )?thousands\s*\)/i, factor: 1_000 },
  { pattern: /\bin millions\b|\(\s*\$?\s*(in )?millions\s*\)/i, factor: 1_000_000 },
];

/** Pull every plausible dollar figure out of one row, left to right. */
function numbersInRow(cells: string[]): number[] {
  const out: number[] = [];
  for (const cell of cells) {
    const raw = cell.trim();
    if (!raw) continue;
    // A year or a bare count is not a dollar figure we want.
    if (/^(fy)?(19|20)\d{2}$/i.test(raw.replace(/[$,\s]/g, ""))) continue;
    if (!/\d/.test(raw)) continue;
    if (!/^[-(]?\$?[\d,]+(\.\d+)?\)?%?$/.test(raw.replace(/\s/g, ""))) continue;
    if (raw.includes("%")) continue;
    const negative = /^\(.*\)$/.test(raw) || raw.trim().startsWith("-") || raw.includes("-$");
    const value = Math.abs(parseUsd(raw));
    if (!value) continue;
    out.push(negative ? -value : value);
  }
  return out;
}

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if ((ch === "," || ch === "\t") && !quoted) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/**
 * A comma inside "3,000,000" is not a delimiter. Only a comma or tab that is
 * not part of a number means the row is really CSV / TSV.
 */
function looksDelimited(line: string): boolean {
  return /[,	]/.test(line.replace(/(?<=\d),(?=\d{3}(\D|$))/g, ""));
}

/**
 * Whitespace-column text (PDF / plain text) has no delimiter, so fall back to
 * splitting the label off the first run of two-plus spaces.
 */
function splitLooseRow(line: string): string[] {
  const parts = line.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  const m = line.match(/^(.*?)(\s+[-(]?\$[\d,]+.*)$/);
  if (m) return [m[1].trim(), ...m[2].trim().split(/\s+/)];
  return [line.trim()];
}

export function extractFinancialsFromText(text: string, source: string): FinancialExtract {
  let scale = 1;
  for (const { pattern, factor } of MULTIPLIER) {
    if (pattern.test(text.slice(0, 4000))) scale = factor;
  }

  const best: Partial<Record<FinancialField, { hit: FinancialHit; priority: number }>> = {};

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = looksDelimited(line) ? splitRow(line) : splitLooseRow(line);
    const label = (cells[0] ?? "").replace(/^["'\s]+|["'\s:]+$/g, "");
    if (!label || !/[a-z]/i.test(label)) continue;
    if (REJECT.some((r) => r.test(label))) continue;

    const values = numbersInRow(cells.slice(1));
    if (!values.length) continue;
    // Statements run oldest to newest across columns; the rightmost is current.
    const value = values[values.length - 1];
    if (value <= 0) continue;

    for (const rule of RULES) {
      if (!rule.match.test(label)) continue;
      const existing = best[rule.field];
      if (existing && existing.priority >= rule.priority) continue;
      best[rule.field] = {
        priority: rule.priority,
        hit: { value: Math.round(value * scale), label, source },
      };
      break;
    }
  }

  const out: FinancialExtract = {};
  for (const field of ["cash", "ebitda", "revenue"] as FinancialField[]) {
    const found = best[field];
    if (found) out[field] = found.hit;
  }
  return out;
}

export function extractFinancialsFromUpload(bytes: Buffer, filename: string): FinancialExtract {
  return extractFinancialsFromText(extractTextFromUpload(bytes, filename), filename);
}

/** Which statement to believe first for each figure. */
const PREFERRED_DOC: Record<FinancialField, string[]> = {
  cash: ["balance_sheet", "cash_flow", "reporting_pack", "income_statement", "financials"],
  ebitda: ["income_statement", "reporting_pack", "financials", "balance_sheet", "cash_flow"],
  revenue: ["income_statement", "reporting_pack", "financials", "balance_sheet", "cash_flow"],
};

/** Merge per-file results, taking each figure from the statement that owns it. */
export function mergeFinancialExtracts(
  parts: { type: string; extract: FinancialExtract }[],
): FinancialExtract {
  const merged: FinancialExtract = {};
  for (const field of ["cash", "ebitda", "revenue"] as FinancialField[]) {
    const order = PREFERRED_DOC[field];
    const ranked = [...parts].sort((a, b) => {
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
    });
    for (const part of ranked) {
      const hit = part.extract[field];
      if (hit) {
        merged[field] = hit;
        break;
      }
    }
  }
  return merged;
}
