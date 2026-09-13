import { validateBenchmarks } from "../src/lib/benchmarks.validate";
import { ARCHETYPE_LABEL, archetypeBenchmarkConfidence } from "../src/lib/rubric";
import type { Archetype } from "../src/lib/types";

const errors = validateBenchmarks();

if (errors.length) {
  console.error(`\n${errors.length} benchmark problem(s):\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error("");
  process.exit(1);
}

console.log("\nBenchmarks valid.\n");
console.log("  archetype        total  sourced  derived  estimated");
console.log("  ---------------------------------------------------");
let t = 0, s = 0, d = 0, e = 0;
for (const a of Object.keys(ARCHETYPE_LABEL) as Archetype[]) {
  const c = archetypeBenchmarkConfidence(a);
  t += c.total; s += c.sourced; d += c.derived; e += c.estimated;
  console.log(
    `  ${a.padEnd(16)}${String(c.total).padStart(5)}${String(c.sourced).padStart(9)}` +
      `${String(c.derived).padStart(9)}${String(c.estimated).padStart(11)}`,
  );
}
console.log("  ---------------------------------------------------");
console.log(`  ${"TOTAL".padEnd(16)}${String(t).padStart(5)}${String(s).padStart(9)}${String(d).padStart(9)}${String(e).padStart(11)}`);
console.log(`\n  ${((s / t) * 100).toFixed(1)}% sourced\n`);
