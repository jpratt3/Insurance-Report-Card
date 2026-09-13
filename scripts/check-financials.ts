/**
 * Runs the PM-setup autofill parser over the sample pack and checks it reads
 * the same cash / EBITDA / revenue out of every format (CSV, PDF, XLSX).
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import {
  extractFinancialsFromUpload,
  mergeFinancialExtracts,
  type FinancialExtract,
} from "../src/lib/financials";
import { formatUsd } from "../src/lib/money";

const DIR = join(process.cwd(), "docs", "Halcyon");
const EXPECTED = { cash: 3_000_000, ebitda: 4_500_000, revenue: 38_000_000 };

function slotFor(filename: string): string {
  if (/P&L|income/i.test(filename)) return "income_statement";
  if (/balance/i.test(filename)) return "balance_sheet";
  if (/cash-flow/i.test(filename)) return "cash_flow";
  if (/board|pack/i.test(filename)) return "reporting_pack";
  return "other";
}

if (!existsSync(DIR)) {
  console.error(`\nNo sample pack at ${DIR}.\n`);
  process.exit(1);
}

const parts: { type: string; extract: FinancialExtract }[] = [];
console.log("\n  slot              file                                        cash        ebitda      revenue");
console.log("  " + "-".repeat(96));

for (const file of readdirSync(DIR)) {
  if (!/\.(csv|pdf|xlsx|xls|txt)$/i.test(file)) continue;
  const type = slotFor(file);
  const extract = extractFinancialsFromUpload(readFileSync(join(DIR, file)), file);
  if (type !== "other") parts.push({ type, extract });
  console.log(
    `  ${type.padEnd(18)}${file.slice(0, 42).padEnd(44)}` +
      `${formatUsd(extract.cash?.value, "—").padEnd(12)}` +
      `${formatUsd(extract.ebitda?.value, "—").padEnd(12)}` +
      `${formatUsd(extract.revenue?.value, "—")}`,
  );
}

const merged = mergeFinancialExtracts(parts);
const errors: string[] = [];
for (const [field, want] of Object.entries(EXPECTED) as [keyof typeof EXPECTED, number][]) {
  const got = merged[field]?.value ?? null;
  if (got !== want) {
    errors.push(`${field}: expected ${formatUsd(want)}, read ${formatUsd(got, "nothing")}`);
  }
}

console.log("\n  Autofill would write:");
for (const field of ["cash", "ebitda", "revenue"] as const) {
  const hit = merged[field];
  console.log(`    ${field.padEnd(8)}${formatUsd(hit?.value, "—").padEnd(14)}${hit ? `${hit.label} — ${hit.source}` : ""}`);
}

if (errors.length) {
  console.error("\nAutofill parse failed:");
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error("");
  process.exit(1);
}
console.log("\nAutofill parse matches the sample pack.\n");
