import type { Archetype, PolicyLineType } from "./types";
import lineBandsFile from "../data/benchmarks/line-bands.json";
import premiumBandsFile from "../data/benchmarks/premium-bands.json";
import requiredLinesFile from "../data/benchmarks/required-lines.json";

/**
 * Benchmark values carry their own provenance so a number shown to a broker can
 * be traced back to where it came from — or flagged as a guess.
 *
 * - `sourced`   the value was read off a cited source and re-verified against it
 * - `derived`   computed from sourced inputs, or an engine convention
 * - `estimated` practitioner judgment; defensible, but not evidence
 *
 * Research agents write `sourced` entries into the JSON files under
 * src/data/benchmarks/. Nothing may be promoted to `sourced` without a
 * `sourceUrl` that actually contains the value.
 */
export type Confidence = "sourced" | "derived" | "estimated";

export interface Provenance {
  confidence: Confidence;
  /** What the number represents (e.g. "p75 of contract-required umbrella limits"). */
  basis: string;
  source: string;
  sourceUrl: string | null;
  /** YYYY-MM the value was last confirmed. */
  asOf: string;
}

export interface Benchmarked<T = number> extends Provenance {
  value: T;
}

/** A raw entry is either a bare value inheriting file-level provenance, or a full record. */
type Raw<T> = T | ({ value: T } & Partial<Provenance>);

interface BenchmarkFile<T> {
  schemaVersion: number;
  defaultProvenance: Provenance;
  archetypes: Record<string, T>;
}

function normalize<T>(raw: Raw<T>, fallback: Provenance): Benchmarked<T> {
  if (raw !== null && typeof raw === "object" && "value" in (raw as object)) {
    const r = raw as { value: T } & Partial<Provenance>;
    return { ...fallback, ...r };
  }
  return { ...fallback, value: raw as T };
}

// --- line bands -------------------------------------------------------------

type RawLineBands = BenchmarkFile<
  Record<string, { occurrence: Raw<number>; aggregate: Raw<number> }>
>;

export interface BenchmarkedLineBand {
  occurrence: Benchmarked<number>;
  aggregate: Benchmarked<number>;
}

const rawLineBands = lineBandsFile as unknown as RawLineBands;

export const LINE_BANDS_SOURCED: Record<
  Archetype,
  Partial<Record<PolicyLineType, BenchmarkedLineBand>>
> = Object.fromEntries(
  Object.entries(rawLineBands.archetypes).map(([archetype, lines]) => [
    archetype,
    Object.fromEntries(
      Object.entries(lines).map(([line, band]) => [
        line,
        {
          occurrence: normalize(band.occurrence, rawLineBands.defaultProvenance),
          aggregate: normalize(band.aggregate, rawLineBands.defaultProvenance),
        },
      ]),
    ),
  ]),
) as Record<Archetype, Partial<Record<PolicyLineType, BenchmarkedLineBand>>>;

// --- premium bands ----------------------------------------------------------

type RawPremiumBands = BenchmarkFile<{ good: Raw<number>; watch: Raw<number> }>;

export interface BenchmarkedPremiumBand {
  good: Benchmarked<number>;
  watch: Benchmarked<number>;
}

const rawPremiumBands = premiumBandsFile as unknown as RawPremiumBands;

export const PREMIUM_BENCHMARK_SOURCED: Record<Archetype, BenchmarkedPremiumBand> =
  Object.fromEntries(
    Object.entries(rawPremiumBands.archetypes).map(([archetype, band]) => [
      archetype,
      {
        good: normalize(band.good, rawPremiumBands.defaultProvenance),
        watch: normalize(band.watch, rawPremiumBands.defaultProvenance),
      },
    ]),
  ) as Record<Archetype, BenchmarkedPremiumBand>;

// --- required lines ---------------------------------------------------------

type RawRequiredLines = BenchmarkFile<Raw<PolicyLineType>[]>;

const rawRequiredLines = requiredLinesFile as unknown as RawRequiredLines;

export const REQUIRED_LINES_SOURCED: Record<Archetype, Benchmarked<PolicyLineType>[]> =
  Object.fromEntries(
    Object.entries(rawRequiredLines.archetypes).map(([archetype, lines]) => [
      archetype,
      lines.map((l) => normalize(l, rawRequiredLines.defaultProvenance)),
    ]),
  ) as Record<Archetype, Benchmarked<PolicyLineType>[]>;

// --- plain views (what the scoring engine consumes) -------------------------

export const LINE_BANDS: Record<
  Archetype,
  Partial<Record<PolicyLineType, { occurrence: number; aggregate: number }>>
> = Object.fromEntries(
  Object.entries(LINE_BANDS_SOURCED).map(([archetype, lines]) => [
    archetype,
    Object.fromEntries(
      Object.entries(lines).map(([line, band]) => [
        line,
        { occurrence: band!.occurrence.value, aggregate: band!.aggregate.value },
      ]),
    ),
  ]),
) as Record<Archetype, Partial<Record<PolicyLineType, { occurrence: number; aggregate: number }>>>;

export const PREMIUM_BENCHMARK: Record<Archetype, { good: number; watch: number }> =
  Object.fromEntries(
    Object.entries(PREMIUM_BENCHMARK_SOURCED).map(([archetype, band]) => [
      archetype,
      { good: band.good.value, watch: band.watch.value },
    ]),
  ) as Record<Archetype, { good: number; watch: number }>;

export const REQUIRED_LINES: Record<Archetype, PolicyLineType[]> = Object.fromEntries(
  Object.entries(REQUIRED_LINES_SOURCED).map(([archetype, lines]) => [
    archetype,
    lines.map((l) => l.value),
  ]),
) as Record<Archetype, PolicyLineType[]>;

// --- provenance accessors ---------------------------------------------------

export function lineBandProvenance(
  archetype: Archetype,
  line: PolicyLineType,
): BenchmarkedLineBand | undefined {
  return LINE_BANDS_SOURCED[archetype][line];
}

export function premiumBandProvenance(archetype: Archetype): BenchmarkedPremiumBand {
  return PREMIUM_BENCHMARK_SOURCED[archetype];
}

export function requiredLineProvenance(
  archetype: Archetype,
  line: PolicyLineType,
): Benchmarked<PolicyLineType> | undefined {
  return REQUIRED_LINES_SOURCED[archetype].find((l) => l.value === line);
}

/**
 * A band of 1 is a presence-only sentinel (see property in line-bands.json), not
 * a real limit. Callers that render limits should skip these rather than print "$1".
 */
export function isPresenceOnly(archetype: Archetype, line: PolicyLineType): boolean {
  const band = lineBandProvenance(archetype, line);
  return band != null && band.occurrence.value <= 1;
}

export interface ConfidenceSummary {
  total: number;
  sourced: number;
  derived: number;
  estimated: number;
  /** True when no benchmark behind this archetype has been sourced yet. */
  allEstimated: boolean;
}

/** Counts every benchmark value backing one archetype. Feeds provisional grading. */
export function archetypeBenchmarkConfidence(archetype: Archetype): ConfidenceSummary {
  const values: Provenance[] = [
    ...Object.values(LINE_BANDS_SOURCED[archetype]).flatMap((b) =>
      b ? [b.occurrence, b.aggregate] : [],
    ),
    PREMIUM_BENCHMARK_SOURCED[archetype].good,
    PREMIUM_BENCHMARK_SOURCED[archetype].watch,
    ...REQUIRED_LINES_SOURCED[archetype],
  ];
  const count = (c: Confidence) => values.filter((v) => v.confidence === c).length;
  const sourced = count("sourced");
  const derived = count("derived");
  return {
    total: values.length,
    sourced,
    derived,
    estimated: count("estimated"),
    allEstimated: sourced === 0,
  };
}
