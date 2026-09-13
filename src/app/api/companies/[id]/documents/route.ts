import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addDocument, getCompany, guessKind, replaceSoiPolicies } from "@/lib/db";
import { scoreCompany } from "@/lib/score";
import { digestSoi, extractTextFromUpload } from "@/lib/soi";
import type { UploadedDocument } from "@/lib/types";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.role === "cfo" && session.companyId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!getCompany(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const dir = join(process.cwd(), "data", "uploads", id);
  mkdirSync(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^\w.\- ]+/g, "_");
  const storedPath = join(dir, `${Date.now()}-${safe}`);
  writeFileSync(storedPath, bytes);

  const type = (String(form.get("kind") || "") || guessKind(file.name)) as UploadedDocument["type"];
  const policyId = String(form.get("policyId") || "") || null;
  const doc: UploadedDocument = {
    id: crypto.randomUUID(),
    type,
    filename: file.name,
    storedPath,
    uploadedAt: new Date().toISOString(),
    extractConfidence: null,
    extractNotes: "Stored on intake. Grade is not shown on this surface.",
    policyId,
  };
  addDocument(id, doc);

  let soiMessage = "";
  if (type === "schedule_of_insurance") {
    const { policies, method } = await digestSoi(extractTextFromUpload(bytes, file.name));
    if (policies.length) {
      replaceSoiPolicies(id, policies);
      soiMessage = `SOI digested (${method}): ${policies.length} ${policies.length === 1 ? "policy" : "policies"} listed.`;
    } else {
      soiMessage =
        "SOI saved, but no policy lines could be read. Drop policies / endorsements in the general slot, or upload a CSV with a Line column.";
    }
  }

  const company = getCompany(id);
  const score = company ? scoreCompany(company) : null;
  return NextResponse.json({
    missingDocuments: score?.missingDocuments ?? [],
    receivedDocuments: score?.receivedDocuments ?? [],
    soiMessage,
  });
}
