import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { seedCompanies } from "../src/lib/seed-data";
import { scoreCompany } from "../src/lib/score";

/**
 * Golden snapshot of the seeded book. Benchmarks are the main input to scoring,
 * so any change to src/data/benchmarks/*.json shows up here as a letter or pillar
 * diff. Run with --update to accept a change; the diff is the review artifact when
 * a research agent's numbers land.
 */
const SNAPSHOT = join(process.cwd(), "scripts", "scoring.snapshot.json");

const actual = seedCompanies().map((c) => {
  const r = scoreCompany(c);
  return {
    id: c.id,
    archetype: c.archetype,
    letter: r.letter,
    letterFromMath: r.letterFromMath,
    rawTotal: r.rawTotal,
    knockouts: r.knockouts.filter((k) => k.triggered).map((k) => k.id),
    pillars: Object.fromEntries(r.pillars.map((p) => [p.id, p.points])),
    flagCount: r.flags.length,
    provisional: r.dataConfidence.provisional,
  };
});

if (process.argv.includes("--update") || !existsSync(SNAPSHOT)) {
  writeFileSync(SNAPSHOT, JSON.stringify(actual, null, 2) + "\n");
  console.log(`Snapshot written: ${actual.length} companies.`);
  actual.forEach((a) => console.log(`  ${a.id.padEnd(20)} ${a.letter}  ${a.rawTotal}/100`));
  process.exit(0);
}

const expected = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const diffs: string[] = [];

actual.forEach((a, i) => {
  const b = expected[i];
  if (!b || b.id !== a.id) { diffs.push(`company ${i}: ${b?.id ?? "(none)"} -> ${a.id}`); return; }
  if (a.letter !== b.letter) diffs.push(`${a.id}: letter ${b.letter} -> ${a.letter}`);
  if (a.rawTotal !== b.rawTotal) diffs.push(`${a.id}: total ${b.rawTotal} -> ${a.rawTotal}`);
  for (const [p, v] of Object.entries(a.pillars)) {
    if (b.pillars[p] !== v) diffs.push(`${a.id}: pillar ${p} ${b.pillars[p]} -> ${v}`);
  }
  if (JSON.stringify(a.knockouts) !== JSON.stringify(b.knockouts)) {
    diffs.push(`${a.id}: knockouts [${b.knockouts}] -> [${a.knockouts}]`);
  }
  if (a.flagCount !== b.flagCount) diffs.push(`${a.id}: flags ${b.flagCount} -> ${a.flagCount}`);
});

if (diffs.length) {
  console.error(`\nScoring changed (${diffs.length}):\n`);
  diffs.forEach((d) => console.error(`  ~ ${d}`));
  console.error("\nIf intended, re-run with --update.\n");
  process.exit(1);
}
console.log(`\nScoring unchanged across ${actual.length} companies.\n`);
actual.forEach((a) => console.log(`  ${a.id.padEnd(20)} ${a.letter}  ${a.rawTotal}/100`));
console.log("");
