import { NextResponse } from "next/server";
import { getSession, usernameTaken } from "@/lib/auth";
import { parseUsd } from "@/lib/money";
import { addCompany, addDocument, listCompanies } from "@/lib/db";
import { PM_SETUP_DOCUMENTS } from "@/lib/inputs";
import { scoreCompany } from "@/lib/score";
import type { DocumentType, UploadedDocument } from "@/lib/types";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "pm") {
    return NextResponse.json({ error: "PM only" }, { status: 403 });
  }
  let companies;
  try {
    companies = listCompanies().map((c) => {
      try {
        const checklist = scoreCompany(c);
        const ready = c.policies.length > 0;
        const score = ready ? checklist : null;
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          partnered: c.partnered,
          sector: c.sector,
          archetype: c.archetype,
          revenue: c.exposures.revenue,
          cash: c.exposures.cash,
          ebitda: c.exposures.ebitda,
          maxSir: c.goals.maxSir,
          readyToScore: ready,
          rawTotal: score?.rawTotal ?? null,
          letter: score?.letter ?? null,
          letterFromMath: score?.letterFromMath ?? null,
          knockoutCount: score?.knockoutCount ?? 0,
          flagCount: score?.flags.length ?? 0,
          missingCount: checklist.missingDocuments.length,
        };
      } catch (err) {
        console.error("score failed", c.id, err);
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          partnered: c.partnered,
          sector: c.sector,
          archetype: c.archetype,
          revenue: c.exposures?.revenue ?? 0,
          cash: c.exposures?.cash ?? 0,
          ebitda: c.exposures?.ebitda ?? 0,
          maxSir: c.goals?.maxSir ?? 0,
          readyToScore: (c.policies?.length ?? 0) > 0,
          rawTotal: null,
          letter: null,
          letterFromMath: null,
          knockoutCount: 0,
          flagCount: 0,
          missingCount: 0,
        };
      }
    });
  } catch (err) {
    console.error("list companies failed", err);
    return NextResponse.json({ companies: [], error: "Could not read the book" }, { status: 500 });
  }
  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "pm") {
    return NextResponse.json({ error: "PM only" }, { status: 403 });
  }

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const template = String(form.get("template") || "clinic") as "clinic" | "field" | "saas";
  const cash = parseUsd(form.get("cash"));
  const ebitda = parseUsd(form.get("ebitda"));
  const revenue = parseUsd(form.get("revenue"));
  const cfoUsername = String(form.get("cfoUsername") || "").trim();
  const cfoPassword = String(form.get("cfoPassword") || "").trim();
  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  if (!cfoUsername || !cfoPassword) {
    return NextResponse.json({ error: "Set a CFO username and password" }, { status: 400 });
  }
  if (/\s/.test(cfoUsername)) {
    return NextResponse.json({ error: "CFO username cannot contain spaces" }, { status: 400 });
  }
  if (cfoPassword.length < 6) {
    return NextResponse.json({ error: "CFO password must be at least 6 characters" }, { status: 400 });
  }
  if (usernameTaken(cfoUsername)) {
    return NextResponse.json({ error: `Username "${cfoUsername}" is already taken` }, { status: 400 });
  }
  if (!cash && !ebitda && !revenue) {
    return NextResponse.json(
      { error: "Enter at least cash, EBITDA, or revenue from the statements" },
      { status: 400 },
    );
  }

  const uploads: { type: DocumentType; file: File }[] = [];
  for (const doc of PM_SETUP_DOCUMENTS) {
    for (const file of form.getAll(doc.type)) {
      if (file instanceof File && file.size) uploads.push({ type: doc.type, file });
    }
  }
  for (const file of form.getAll("files")) {
    if (file instanceof File && file.size) uploads.push({ type: "financials", file });
  }

  const hasRequired = uploads.some((u) =>
    PM_SETUP_DOCUMENTS.some((d) => d.required && d.type === u.type),
  );
  if (!hasRequired && !uploads.length) {
    return NextResponse.json({ error: "Upload financial statements to start the company" }, { status: 400 });
  }
  if (!hasRequired) {
    return NextResponse.json(
      { error: "Drop the P&L or balance sheet (a combined audit can go in either required slot)." },
      { status: 400 },
    );
  }

  const company = addCompany({
    name,
    template,
    cash,
    ebitda,
    revenue,
    login: { username: cfoUsername, password: cfoPassword },
  });
  for (const { type, file } of uploads) {
    const dir = join(process.cwd(), "data", "uploads", company.id);
    mkdirSync(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^\w.\- ]+/g, "_");
    const storedPath = join(dir, `${Date.now()}-${safe}`);
    writeFileSync(storedPath, bytes);
    const doc: UploadedDocument = {
      id: crypto.randomUUID(),
      type,
      filename: file.name,
      storedPath,
      uploadedAt: new Date().toISOString(),
      extractNotes: "PM opening pack",
      extractConfidence: null,
    };
    addDocument(company.id, doc);
  }

  const saved = listCompanies().find((c) => c.id === company.id) ?? company;
  return NextResponse.json({ company: saved });
}
