import { inflateRawSync } from "zlib";
import { formatUsd } from "./money";
import { LINE_LABEL } from "./rubric";
import type { PolicyLine, PolicyLineType } from "./types";

const LINE_ALIASES: { line: PolicyLineType; pattern: RegExp }[] = [
  { line: "gl", pattern: /general liability|\bcgl\b|\bgl\b/i },
  { line: "professional", pattern: /professional|malpractice|medmal|med[\s-]?mal/i },
  { line: "tech_eo", pattern: /tech(?:nology)?\s*e\s*&\s*o|errors?\s*and\s*omissions|\be&o\b/i },
  { line: "inland_marine", pattern: /inland marine|tools?\s*floater/i },
  { line: "hnoa", pattern: /hired|non-?owned auto|\bhnoa\b/i },
  { line: "auto", pattern: /commercial auto|\bauto\b|business auto/i },
  { line: "umbrella", pattern: /umbrella|excess/i },
  { line: "wc", pattern: /workers?\s*comp|workmen'?s|\bwc\b/i },
  { line: "cyber", pattern: /\bcyber\b|network security|privacy/i },
  { line: "do", pattern: /directors?\s*(and|&)\s*officers|\bd&o\b|\bdo\b/i },
  { line: "epli", pattern: /employment practices|\bepli\b/i },
  { line: "crime", pattern: /\bcrime\b|fidelity|social engineering/i },
  { line: "abuse", pattern: /abuse|molestation|\bsam\b/i },
  { line: "property", pattern: /\bproperty\b|\bbop\b/i },
  { line: "pollution", pattern: /pollution|environmental/i },
  { line: "fiduciary", pattern: /fiduciary/i },
];

export function extractTextFromUpload(bytes: Buffer, filename: string): string {
  const name = filename.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".json")) {
    return bytes.toString("utf8");
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    const sheet = unzipEntry(bytes, "xl/worksheets/sheet1.xml");
    if (sheet) return sheetXmlToCsv(sheet.toString("utf8"));
  }
  const asUtf8 = bytes.toString("utf8");
  if (asUtf8.includes("ss:Workbook") || asUtf8.includes("urn:schemas-microsoft-com:office:spreadsheet")) {
    return spreadsheetMlToCsv(asUtf8);
  }
  const raw = bytes.toString("latin1");
  const tj = [...raw.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)].map((m) =>
    m[0]
      .replace(/\s*Tj$/, "")
      .slice(1, -1)
      .replace(/\\([()\\])/g, "$1"),
  );
  if (tj.length >= 4) return tj.join("\n");
  return raw.replace(/[^\t\n\r\x20-\x7e]/g, " ");
}

function unzipEntry(buf: Buffer, suffix: string): Buffer | null {
  let offset = 0;
  while (offset + 30 < buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const fileName = buf.slice(offset + 30, offset + 30 + nameLen).toString("utf8");
    const start = offset + 30 + nameLen + extraLen;
    const data = buf.slice(start, start + compSize);
    if (fileName.replace(/\\/g, "/").endsWith(suffix) || fileName.replace(/\\/g, "/") === suffix) {
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
    }
    offset = start + compSize;
  }
  return null;
}

function sheetXmlToCsv(xml: string): string {
  const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  return rows
    .map((row) => {
      const cells = [...row[1].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g)].map((c) => {
        const t = c[1].match(/<t[^>]*>([\s\S]*?)<\/t>/);
        if (t) return decodeXml(t[1]);
        const v = c[1].match(/<v[^>]*>([\s\S]*?)<\/v>/);
        return v ? decodeXml(v[1]) : "";
      });
      return cells.map(csvCell).join(",");
    })
    .join("\n");
}

function spreadsheetMlToCsv(xml: string): string {
  const rows = [...xml.matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/g)];
  return rows
    .map((row) => {
      const cells = [...row[1].matchAll(/<Data\b[^>]*>([\s\S]*?)<\/Data>/g)].map((c) => decodeXml(c[1]));
      return cells.map(csvCell).join(",");
    })
    .join("\n");
}

function csvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

function parseMoney(value: string): number {
  const t = value.replace(/[$,\s]/g, "").toUpperCase();
  if (!t) return 0;
  if (t.endsWith("MM")) return Number(t.slice(0, -2)) * 1_000_000 || 0;
  if (t.endsWith("M")) return Number(t.slice(0, -1)) * 1_000_000 || 0;
  if (t.endsWith("K")) return Number(t.slice(0, -1)) * 1_000 || 0;
  return Number(t.replace(/[^0-9.]/g, "")) || 0;
}

function detectLine(text: string): PolicyLineType | null {
  for (const alias of LINE_ALIASES) {
    if (alias.pattern.test(text)) return alias.line;
  }
  return null;
}

function blankPolicy(line: PolicyLineType): PolicyLine {
  return {
    id: crypto.randomUUID(),
    line,
    carrier: "",
    amBest: "",
    limitOccurrence: 0,
    limitAggregate: 0,
    retention: 0,
    premium: 0,
    retroDate: null,
    waitingHours: null,
    socialEngineeringLimit: null,
    additionalInsured: false,
    primaryNonContributory: false,
    waiverSubrogation: false,
    attachesOver: [],
    umbrellaGap: false,
    notes: "From schedule of insurance",
    source: "soi",
  };
}

function fromCsv(text: string): PolicyLine[] {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  const headerAt = rows.findIndex((row) => {
    const headers = splitCsv(row).map((h) => h.toLowerCase());
    return headers.some((h) => h === "line" || h === "coverage" || h === "type");
  });
  if (headerAt < 0) return [];
  const headers = splitCsv(rows[headerAt]).map((h) => h.toLowerCase());
  const lineIdx = headers.findIndex((h) => h === "line" || h === "coverage" || h === "type");
  if (lineIdx < 0) return [];
  const out: PolicyLine[] = [];
  for (const row of rows.slice(headerAt + 1)) {
    const cols = splitCsv(row);
    const line = detectLine(cols[lineIdx] || "");
    if (!line) continue;
    const p = blankPolicy(line);
    p.carrier = pick(cols, headers, /carrier|insurer/) || "";
    p.amBest = pick(cols, headers, /am\s*best|rating/) || "";
    p.limitOccurrence = parseMoney(pick(cols, headers, /occ|occurrence|limit/) || "0");
    p.limitAggregate = parseMoney(pick(cols, headers, /agg/) || "") || p.limitOccurrence;
    p.retention = parseMoney(pick(cols, headers, /reten|sir|deduct/) || "0");
    p.premium = parseMoney(pick(cols, headers, /premium/) || "0");
    out.push(p);
  }
  return dedupe(out);
}

function splitCsv(row: string): string[] {
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
  return out;
}

function pick(cols: string[], headers: string[], re: RegExp): string {
  const i = headers.findIndex((h) => re.test(h));
  return i >= 0 ? cols[i] ?? "" : "";
}

function fromFreeText(text: string): PolicyLine[] {
  const out: PolicyLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = detectLine(raw);
    if (!line) continue;
    const p = blankPolicy(line);
    const money = [...raw.matchAll(/\$[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*[MmKk]\b/g)].map((m) => parseMoney(m[0]));
    if (money[0]) p.limitOccurrence = money[0];
    if (money[1]) p.limitAggregate = money[1];
    const carrier = raw.match(/\b(Chubb|AIG|Hartford|Travelers|Zurich|CNA|Liberty|Berkshire|Beazley|Hiscox|Crum|Markel)\b/i);
    if (carrier) p.carrier = carrier[1];
    out.push(p);
  }
  return dedupe(out);
}

function dedupe(policies: PolicyLine[]): PolicyLine[] {
  const seen = new Set<string>();
  return policies.filter((p) => {
    if (seen.has(p.line)) return false;
    seen.add(p.line);
    return true;
  });
}

async function fromLlm(text: string): Promise<PolicyLine[]> {
  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const hint = `Extract a schedule of insurance as JSON {"policies":[{"line":"gl|property|auto|hnoa|wc|umbrella|professional|abuse|cyber|do|epli|crime|tech_eo|inland_marine|pollution|fiduciary","carrier":"","amBest":"","limitOccurrence":0,"limitAggregate":0,"retention":0,"premium":0}]}.
Use only those line keys. Do not invent a score. Skip unknown lines.`;
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
      if (raw) return normalizeLlm(JSON.parse(raw).policies);
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
          max_tokens: 4000,
          messages: [{ role: "user", content: `${hint}\n\n${text.slice(0, 20000)}` }],
        }),
      });
      const json = await res.json();
      const raw = json.content?.[0]?.text ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return normalizeLlm(JSON.parse(match[0]).policies);
    }
  } catch {
    return [];
  }
  return [];
}

function normalizeLlm(rows: unknown): PolicyLine[] {
  if (!Array.isArray(rows)) return [];
  const allowed = new Set(Object.keys(LINE_LABEL));
  return dedupe(
    rows.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const r = row as Record<string, unknown>;
      const line = String(r.line || "");
      if (!allowed.has(line)) return [];
      const p = blankPolicy(line as PolicyLineType);
      p.carrier = String(r.carrier || "");
      p.amBest = String(r.amBest || "");
      p.limitOccurrence = Number(r.limitOccurrence) || 0;
      p.limitAggregate = Number(r.limitAggregate) || p.limitOccurrence;
      p.retention = Number(r.retention) || 0;
      p.premium = Number(r.premium) || 0;
      return [p];
    }),
  );
}

export async function digestSoi(text: string): Promise<{ policies: PolicyLine[]; method: string }> {
  const csv = fromCsv(text);
  if (csv.length) return { policies: csv, method: "csv" };
  const heuristic = fromFreeText(text);
  if (heuristic.length) return { policies: heuristic, method: "text" };
  const llm = await fromLlm(text);
  if (llm.length) return { policies: llm, method: "llm" };
  return { policies: [], method: "none" };
}

export { formatUsd };

export function formatLimit(n: number): string {
  return formatUsd(n);
}
