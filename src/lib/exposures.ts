import type { Exposures } from "./types";

const FIELD_ALIASES: { key: keyof Exposures; pattern: RegExp }[] = [
  { key: "revenue", pattern: /^(?:net )?program revenue|^revenue$|^ttm revenue|^sales$/i },
  { key: "ebitda", pattern: /^ebitda$/i },
  { key: "cash", pattern: /^cash(?: and cash equivalents)?$|^liquidity$/i },
  { key: "payroll", pattern: /^payroll(?: ttm)?$/i },
  { key: "employees", pattern: /^employees$|^headcount$|^w-?2$/i },
  { key: "locations", pattern: /^locations?$/i },
  { key: "vehicles", pattern: /^(?:owned |long-term leased )?vehicles$/i },
  { key: "tiv", pattern: /^tiv$|^total insured value$/i },
  { key: "yearsInBusiness", pattern: /^years in business$|^year founded$/i },
  { key: "emr", pattern: /^emr$|^experience mod(?:ifier)?$/i },
  { key: "largestWire", pattern: /^largest (?:typical )?wire|^ap run$/i },
  { key: "maxDeductible", pattern: /^max(?:imum)? (?:deductible|sir)$/i },
  { key: "contractMinUmbrella", pattern: /^(?:contract )?(?:min(?:imum)? )?umbrella/i },
  { key: "contractMinCyber", pattern: /^(?:contract )?(?:min(?:imum)? )?cyber/i },
  { key: "contractMinEo", pattern: /^(?:contract )?(?:min(?:imum)? )?(?:e&o|professional)/i },
  { key: "hasPhi", pattern: /^(?:holds )?phi$|^has phi$/i },
  { key: "hasCustomerData", pattern: /^(?:holds )?customer data$|^pii$/i },
  { key: "notes", pattern: /^notes$/i },
];

function splitCsvLine(row: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((c) => c.replace(/^"|"$/g, ""));
}

function parseMoney(value: string): number {
  const t = value.replace(/[$,\s]/g, "").toUpperCase();
  if (!t) return 0;
  if (t.endsWith("MM")) return Number(t.slice(0, -2)) * 1_000_000 || 0;
  if (t.endsWith("M")) return Number(t.slice(0, -1)) * 1_000_000 || 0;
  if (t.endsWith("K")) return Number(t.slice(0, -1)) * 1_000 || 0;
  return Number(t.replace(/[^0-9.]/g, "")) || 0;
}

function fromCsv(text: string): Partial<Exposures> {
  const found: Partial<Exposures> = {};
  for (const raw of text.split(/\r?\n/)) {
    const cols = splitCsvLine(raw);
    if (cols.length < 2) continue;
    const label = cols[0];
    const value = cols.slice(1).join(",");
    const field = FIELD_ALIASES.find((f) => f.pattern.test(label));
    if (!field) continue;
    assign(found, field.key, value);
  }
  return found;
}

function fromText(text: string): Partial<Exposures> {
  const found: Partial<Exposures> = { ...fromCsv(text) };
  const pairs: { key: keyof Exposures; re: RegExp }[] = [
    { key: "revenue", re: /(?:net )?program revenue|ttm revenue|(?:^|\n)\s*revenue[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
    { key: "ebitda", re: /ebitda[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
    { key: "cash", re: /cash(?: and cash equivalents)?[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
    { key: "payroll", re: /payroll(?: ttm)?[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
    { key: "employees", re: /(?:headcount|employees|w-?2)[:\s]+([\d,]+)/i },
    { key: "locations", re: /locations?[:\s]+([\d,]+)/i },
    { key: "vehicles", re: /(?:owned \/ long-term leased )?vehicles[:\s]+([\d,]+)/i },
    { key: "tiv", re: /(?:tiv|total insured value)[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
    { key: "emr", re: /(?:emr|experience mod(?:ifier)?)[:\s]+([\d.]+)/i },
    { key: "yearsInBusiness", re: /years in business[:\s]+([\d]+)/i },
    { key: "largestWire", re: /largest (?:typical )?wire[:\s]+\$?([\d,.]+(?:\s*[MmKk])?)/i },
  ];
  for (const { key, re } of pairs) {
    if (found[key] != null && found[key] !== 0 && found[key] !== "") continue;
    const m = text.match(re);
    if (m?.[1]) assign(found, key, m[1]);
  }
  const founded = text.match(/founded[:\s]+(\d{4})/i);
  if (founded && found.yearsInBusiness == null) {
    found.yearsInBusiness = Math.max(0, new Date().getFullYear() - Number(founded[1]));
  }
  if (/\bphi\b|protected health information/i.test(text)) found.hasPhi = true;
  if (/customer data|\bpii\b|personally identifiable/i.test(text)) found.hasCustomerData = true;
  return found;
}

function assign(found: Partial<Exposures>, key: keyof Exposures, raw: string) {
  if (key === "hasPhi" || key === "hasCustomerData") {
    found[key] = /^(y|yes|true|1)$/i.test(raw);
    return;
  }
  if (key === "notes") {
    found.notes = raw;
    return;
  }
  if (key === "emr") {
    const n = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(n)) found.emr = n;
    return;
  }
  const n = parseMoney(raw);
  if (n || raw === "0") (found as Record<string, number>)[key] = n;
}

async function fromLlm(text: string): Promise<Partial<Exposures>> {
  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const hint = `Extract insurance exposure facts as JSON. Only include keys you are confident about.
Keys: revenue, payroll, employees, locations, vehicles, tiv, cash, ebitda, maxDeductible, contractMinUmbrella, contractMinCyber, contractMinEo, largestWire, yearsInBusiness, emr (number or null), hasPhi (boolean), hasCustomerData (boolean), notes.
Numbers in whole USD. Do not invent a score.`;
  try {
    if (openai) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openai}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: hint },
            { role: "user", content: text.slice(0, 20000) },
          ],
        }),
      });
      const json = await res.json();
      const raw = json.choices?.[0]?.message?.content;
      if (raw) return sanitize(JSON.parse(raw));
    } else if (anthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          messages: [{ role: "user", content: `${hint}\n\n${text.slice(0, 20000)}` }],
        }),
      });
      const json = await res.json();
      const raw = json.content?.[0]?.text ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return sanitize(JSON.parse(match[0]));
    }
  } catch {
    return {};
  }
  return {};
}

function sanitize(raw: Record<string, unknown>): Partial<Exposures> {
  const found: Partial<Exposures> = {};
  const nums: (keyof Exposures)[] = [
    "revenue",
    "payroll",
    "employees",
    "locations",
    "vehicles",
    "tiv",
    "cash",
    "ebitda",
    "maxDeductible",
    "contractMinUmbrella",
    "contractMinCyber",
    "contractMinEo",
    "largestWire",
    "yearsInBusiness",
  ];
  for (const key of nums) {
    const n = Number(raw[key]);
    if (Number.isFinite(n) && n !== 0) (found as Record<string, number>)[key] = n;
  }
  if (raw.emr != null && raw.emr !== "") {
    const n = Number(raw.emr);
    if (Number.isFinite(n)) found.emr = n;
  }
  if (typeof raw.hasPhi === "boolean") found.hasPhi = raw.hasPhi;
  if (typeof raw.hasCustomerData === "boolean") found.hasCustomerData = raw.hasCustomerData;
  if (typeof raw.notes === "string" && raw.notes.trim()) found.notes = raw.notes.trim();
  return found;
}

export async function digestExposures(text: string): Promise<{
  exposures: Partial<Exposures>;
  found: string[];
  method: string;
}> {
  let exposures = fromText(text);
  let method = "text";
  if (Object.keys(exposures).length < 2) {
    const llm = await fromLlm(text);
    if (Object.keys(llm).length > Object.keys(exposures).length) {
      exposures = { ...exposures, ...llm };
      method = "llm";
    }
  }
  return { exposures, found: Object.keys(exposures), method };
}
