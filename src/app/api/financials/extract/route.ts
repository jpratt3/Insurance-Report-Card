import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  extractFinancialsFromUpload,
  mergeFinancialExtracts,
  type FinancialExtract,
} from "@/lib/financials";
import { PM_SETUP_DOCUMENTS } from "@/lib/inputs";

export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

/** Reads the dropped statements and returns cash / EBITDA / revenue for autofill. */
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "pm") {
    return NextResponse.json({ error: "PM only" }, { status: 403 });
  }

  const form = await req.formData();
  const slots = [...PM_SETUP_DOCUMENTS.map((d) => d.type), "financials"];
  const parts: { type: string; extract: FinancialExtract }[] = [];

  for (const type of slots) {
    for (const file of form.getAll(type)) {
      if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) continue;
      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        parts.push({ type, extract: extractFinancialsFromUpload(bytes, file.name) });
      } catch (err) {
        console.error("financial extract failed", file.name, err);
      }
    }
  }

  const merged = mergeFinancialExtracts(parts);
  return NextResponse.json({
    cash: merged.cash?.value ?? null,
    ebitda: merged.ebitda?.value ?? null,
    revenue: merged.revenue?.value ?? null,
    sources: {
      cash: merged.cash ? `${merged.cash.label} — ${merged.cash.source}` : null,
      ebitda: merged.ebitda ? `${merged.ebitda.label} — ${merged.ebitda.source}` : null,
      revenue: merged.revenue ? `${merged.revenue.label} — ${merged.revenue.source}` : null,
    },
  });
}
