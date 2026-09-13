import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompany } from "@/lib/db";
import { digestExposures } from "@/lib/exposures";
import { isPmFinancial } from "@/lib/inputs";
import { extractTextFromUpload } from "@/lib/soi";
import { readFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.role === "cfo" && session.companyId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const company = getCompany(id);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scanTypes = new Set(["exposure_pack", "sov", "wc_emr", "contract_exhibit"]);
  const files = company.documents.filter(
    (d) => scanTypes.has(d.type) || isPmFinancial(d.type),
  );
  if (!files.length) {
    return NextResponse.json(
      { error: "Drop an exposure document first, then scan." },
      { status: 400 },
    );
  }

  const chunks: string[] = [];
  for (const doc of files) {
    if (!doc.storedPath || !existsSync(doc.storedPath)) continue;
    try {
      const bytes = readFileSync(doc.storedPath);
      chunks.push(`--- ${doc.filename} ---\n${extractTextFromUpload(bytes, doc.filename)}`);
    } catch {
      // skip unreadable
    }
  }
  const text = chunks.join("\n");
  if (!text.trim()) {
    return NextResponse.json(
      { error: "Could not read text from the uploaded files." },
      { status: 400 },
    );
  }

  const { exposures, found, method } = await digestExposures(text);
  return NextResponse.json({
    exposures,
    found,
    method,
    scannedFiles: files.map((d) => d.filename),
  });
}
