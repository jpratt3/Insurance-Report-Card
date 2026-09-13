import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompany, updateCompany } from "@/lib/db";
import { scoreCompany } from "@/lib/score";
import { EXPOSURE_FIELDS, requiredDocuments } from "@/lib/inputs";
import {
  ARCHETYPE_LABEL,
  PM_TEMPLATES,
  REQUIRED_LINES,
  defaultGoalsFor,
  deriveMaxSir,
  templateForArchetype,
} from "@/lib/rubric";
import type { Archetype } from "@/lib/types";

export const dynamic = "force-dynamic";

async function canAccess(id: string) {
  const session = await getSession();
  if (!session) return { session: null, ok: false as const };
  if (session.role === "pm") return { session, ok: true as const };
  if (session.role === "cfo" && session.companyId === id) return { session, ok: true as const };
  return { session, ok: false as const };
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { session, ok } = await canAccess(id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const company = getCompany(id);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let score = null;
  try {
    score = scoreCompany(company);
  } catch (err) {
    console.error("score failed", id, err);
  }

  if (session?.role === "cfo") {
    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        sector: company.sector,
        archetype: company.archetype,
        exposures: company.exposures,
        documents: company.documents,
        policies: company.policies,
      },
      archetypeLabel: ARCHETYPE_LABEL[company.archetype],
      missingDocuments: score?.missingDocuments ?? [],
      receivedDocuments: score?.receivedDocuments ?? [],
      exposureFields: EXPOSURE_FIELDS,
    });
  }

  return NextResponse.json({
    company,
    score,
    readyToScore: company.policies.length > 0,
    archetypeLabel: ARCHETYPE_LABEL[company.archetype],
    requiredLines: REQUIRED_LINES[company.archetype] ?? [],
    requiredDocs: requiredDocuments(company.archetype) ?? [],
    exposureFields: EXPOSURE_FIELDS,
    template: templateForArchetype(company.archetype),
    templates: PM_TEMPLATES,
    derivedSir: deriveMaxSir(company.archetype, company.exposures.cash, company.exposures.ebitda),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { session, ok } = await canAccess(id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const current = getCompany(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session?.role === "cfo") {
    const company = updateCompany(id, {
      exposures: body.exposures ? { ...current.exposures, ...body.exposures } : current.exposures,
    });
    const score = company ? scoreCompany(company) : null;
    return NextResponse.json({
      ok: true,
      missingDocuments: score?.missingDocuments ?? [],
      receivedDocuments: score?.receivedDocuments ?? [],
    });
  }

  let archetype = current.archetype;
  if (body.template) {
    const t = PM_TEMPLATES.find((x) => x.id === body.template);
    if (t) archetype = t.archetype;
  }
  if (body.archetype) archetype = body.archetype as Archetype;

  const exposures = body.exposures ? { ...current.exposures, ...body.exposures } : current.exposures;
  let goals = body.goals ? { ...current.goals, ...body.goals } : { ...current.goals };

  if (body.applyDerivedBar) {
    goals = {
      ...defaultGoalsFor(archetype),
      maxSir: deriveMaxSir(archetype, exposures.cash, exposures.ebitda),
    };
  }

  const company = updateCompany(id, { exposures, goals, archetype, policies: body.policies ?? current.policies });
  return NextResponse.json({ company, score: company ? scoreCompany(company) : null });
}
