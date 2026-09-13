import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompany, removeDocument } from "@/lib/db";
import { scoreCompany } from "@/lib/score";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.role === "cfo" && session.companyId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!getCompany(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const company = removeDocument(id, docId);
  const score = company ? scoreCompany(company) : null;
  return NextResponse.json({
    ok: true,
    missingDocuments: score?.missingDocuments ?? [],
    receivedDocuments: score?.receivedDocuments ?? [],
  });
}
