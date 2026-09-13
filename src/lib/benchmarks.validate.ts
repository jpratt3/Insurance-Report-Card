import { z } from "zod";
import { ARCHETYPE_LABEL, LINE_LABEL } from "./rubric";
import lineBandsFile from "../data/benchmarks/line-bands.json";
import premiumBandsFile from "../data/benchmarks/premium-bands.json";
import requiredLinesFile from "../data/benchmarks/required-lines.json";

/**
 * Runtime validation for src/data/benchmarks/*.json.
 *
 * The loader in ./benchmarks casts the JSON straight to its types, so nothing in
 * TypeScript stops a research agent writing a typo'd archetype key, an unknown
 * line code, or a "sourced" value with no URL behind it. This is the gate that
 * does. Run it in CI and before merging any agent's output.
 */

const ARCHETYPES = Object.keys(ARCHETYPE_LABEL);
const LINES = Object.keys(LINE_LABEL);

const provenance = z.object({
  confidence: z.enum(["sourced", "derived", "estimated"]),
  basis: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().nullable(),
  asOf: z.string().regex(/^\d{4}-\d{2}$/, "asOf must be YYYY-MM"),
});

const rawNumber = z.union([z.number(), provenance.partial().extend({ value: z.number() })]);
const rawLine = z.union([z.string(), provenance.partial().extend({ value: z.string() })]);

const lineBandsSchema = z.object({
  schemaVersion: z.number(),
  defaultProvenance: provenance,
  archetypes: z.record(
    z.string(),
    z.record(z.string(), z.object({ occurrence: rawNumber, aggregate: rawNumber })),
  ),
});

const premiumSchema = z.object({
  schemaVersion: z.number(),
  defaultProvenance: provenance,
  archetypes: z.record(z.string(), z.object({ good: rawNumber, watch: rawNumber })),
});

const requiredSchema = z.object({
  schemaVersion: z.number(),
  defaultProvenance: provenance,
  archetypes: z.record(z.string(), z.array(rawLine)),
});

/** Pulls {value, confidence, sourceUrl} out of a bare-or-full raw entry. */
function unwrap(raw: unknown, fallback: z.infer<typeof provenance>) {
  if (raw !== null && typeof raw === "object" && "value" in (raw as object)) {
    const r = raw as Record<string, unknown>;
    return {
      value: r.value,
      confidence: (r.confidence ?? fallback.confidence) as string,
      sourceUrl: (r.sourceUrl !== undefined ? r.sourceUrl : fallback.sourceUrl) as string | null,
      source: (r.source ?? fallback.source) as string,
    };
  }
  return { value: raw, confidence: fallback.confidence, sourceUrl: fallback.sourceUrl, source: fallback.source };
}

export function validateBenchmarks(): string[] {
  const errors: string[] = [];
  const push = (m: string) => errors.push(m);

  const lb = lineBandsSchema.safeParse(lineBandsFile);
  const pb = premiumSchema.safeParse(premiumBandsFile);
  const rl = requiredSchema.safeParse(requiredLinesFile);

  for (const [name, r] of [["line-bands", lb], ["premium-bands", pb], ["required-lines", rl]] as const) {
    if (!r.success) {
      r.error.issues.forEach((i) => push(`${name}.json: ${i.path.join(".") || "(root)"} — ${i.message}`));
    }
  }
  if (!lb.success || !pb.success || !rl.success) return errors;

  // --- every file covers exactly the archetype union -------------------------
  for (const [name, data] of [
    ["line-bands", lb.data],
    ["premium-bands", pb.data],
    ["required-lines", rl.data],
  ] as const) {
    const keys = Object.keys(data.archetypes);
    ARCHETYPES.filter((a) => !keys.includes(a)).forEach((a) =>
      push(`${name}.json: missing archetype "${a}"`),
    );
    keys.filter((k) => !ARCHETYPES.includes(k)).forEach((k) =>
      push(`${name}.json: unknown archetype "${k}" (not in the Archetype union)`),
    );
  }

  // --- line codes are real ---------------------------------------------------
  for (const [archetype, lines] of Object.entries(lb.data.archetypes)) {
    Object.keys(lines)
      .filter((l) => !LINES.includes(l))
      .forEach((l) => push(`line-bands.json: ${archetype} has unknown line "${l}"`));
  }
  for (const [archetype, lines] of Object.entries(rl.data.archetypes)) {
    const seen = new Set<string>();
    lines.forEach((raw, i) => {
      const { value } = unwrap(raw, rl.data.defaultProvenance);
      const line = String(value);
      if (!LINES.includes(line)) push(`required-lines.json: ${archetype}[${i}] unknown line "${line}"`);
      if (seen.has(line)) push(`required-lines.json: ${archetype} lists "${line}" twice`);
      seen.add(line);
    });
  }

  // --- a required line with no band scores as fully adequate -----------------
  // requiredLimit() falls back to 0, and limitRatio(actual, 0) returns 1, so the
  // line silently earns full credit. Catch it here rather than in a report card.
  for (const [archetype, lines] of Object.entries(rl.data.archetypes)) {
    const bands = lb.data.archetypes[archetype] ?? {};
    for (const raw of lines) {
      const line = String(unwrap(raw, rl.data.defaultProvenance).value);
      const hasBand = line in bands || (line === "auto" && "hnoa" in bands) || (line === "hnoa" && "auto" in bands);
      if (!hasBand) {
        push(
          `cross-file: ${archetype} requires "${line}" but line-bands.json has no band for it — ` +
            `it would score as fully adequate at any limit`,
        );
      }
    }
  }

  // --- "sourced" must actually be sourced ------------------------------------
  const checkSourced = (file: string, path: string, raw: unknown, fallback: z.infer<typeof provenance>) => {
    const u = unwrap(raw, fallback);
    if (u.confidence === "sourced" && !u.sourceUrl) {
      push(`${file}: ${path} is "sourced" but has no sourceUrl — demote to "estimated" or cite it`);
    }
    if (u.confidence === "sourced" && u.sourceUrl && !/^https?:\/\//.test(u.sourceUrl)) {
      push(`${file}: ${path} sourceUrl is not an http(s) URL — "${u.sourceUrl}"`);
    }
  };

  for (const [archetype, lines] of Object.entries(lb.data.archetypes)) {
    for (const [line, band] of Object.entries(lines)) {
      checkSourced("line-bands.json", `${archetype}.${line}.occurrence`, band.occurrence, lb.data.defaultProvenance);
      checkSourced("line-bands.json", `${archetype}.${line}.aggregate`, band.aggregate, lb.data.defaultProvenance);
      const occ = Number(unwrap(band.occurrence, lb.data.defaultProvenance).value);
      const agg = Number(unwrap(band.aggregate, lb.data.defaultProvenance).value);
      if (occ < 0 || agg < 0) push(`line-bands.json: ${archetype}.${line} has a negative limit`);
      if (occ > 1 && agg > 1 && agg < occ) {
        push(`line-bands.json: ${archetype}.${line} aggregate ${agg} is below occurrence ${occ}`);
      }
    }
  }

  for (const [archetype, band] of Object.entries(pb.data.archetypes)) {
    checkSourced("premium-bands.json", `${archetype}.good`, band.good, pb.data.defaultProvenance);
    checkSourced("premium-bands.json", `${archetype}.watch`, band.watch, pb.data.defaultProvenance);
    const good = Number(unwrap(band.good, pb.data.defaultProvenance).value);
    const watch = Number(unwrap(band.watch, pb.data.defaultProvenance).value);
    if (!(good > 0)) push(`premium-bands.json: ${archetype}.good must be > 0`);
    if (!(watch > good)) push(`premium-bands.json: ${archetype}.watch (${watch}) must exceed good (${good})`);
    if (good > 0.25) push(`premium-bands.json: ${archetype}.good is ${good} — a share of revenue, not a percent?`);
  }

  for (const [archetype, lines] of Object.entries(rl.data.archetypes)) {
    lines.forEach((raw, i) =>
      checkSourced("required-lines.json", `${archetype}[${i}]`, raw, rl.data.defaultProvenance),
    );
  }

  return errors;
}
