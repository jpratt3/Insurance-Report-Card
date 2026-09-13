import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompany, updateCompany } from "@/lib/db";
import { scoreCompany } from "@/lib/score";
import type { PolicyLine } from "@/lib/types";

export const dynamic = "force-dynamic";

const schemaHint = `Extract insurance binder facts as JSON { policies: PolicyLine[] }.
PolicyLine fields: line (gl|property|auto|hnoa|wc|umbrella|professional|abuse|cyber|do|epli|crime|tech_eo|inland_marine|pollution|fiduciary),
carrier, amBest, limitOccurrence, limitAggregate, retention, premium, retroDate (YYYY-MM-DD or null),
waitingHours, socialEngineeringLimit, additionalInsured, primaryNonContributory, waiverSubrogation,
attachesOver (array of line keys), umbrellaGap (boolean), notes.
Do not invent a score. Unknown numbers should be 0 or null as appropriate.`;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "pm") return NextResponse.json({ error: "PM only" }, { status: 403 });
  const { id } = await ctx.params;
  const company = getCompany(id);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { text } = (await req.json()) as { text?: string };
  if (!text) return NextResponse.json({ error: "Paste binder text in { text }" }, { status: 400 });

  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  let policies: PolicyLine[] | null = null;
  let provider = "none";

  try {
    if (openai) {
      provider = "openai";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openai}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: schemaHint },
            { role: "user", content: text.slice(0, 24000) },
          ],
        }),
      });
      const json = await res.json();
      const raw = json.choices?.[0]?.message?.content;
      if (raw) policies = JSON.parse(raw).policies;
    } else if (anthropic) {
      provider = "anthropic";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          messages: [{ role: "user", content: `${schemaHint}\n\n${text.slice(0, 24000)}` }],
        }),
      });
      const json = await res.json();
      const raw = json.content?.[0]?.text ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) policies = JSON.parse(match[0]).policies;
    }
  } catch {
    policies = null;
  }

  if (!policies?.length) {
    return NextResponse.json({
      ok: false,
      provider,
      message: "No API key or extract failed. Policies unchanged. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
      score: scoreCompany(company),
    });
  }

  const normalized = policies.map((p) => ({
    ...p,
    id: p.id || crypto.randomUUID(),
    additionalInsured: Boolean(p.additionalInsured),
    primaryNonContributory: Boolean(p.primaryNonContributory),
    waiverSubrogation: Boolean(p.waiverSubrogation),
    attachesOver: p.attachesOver ?? [],
    umbrellaGap: Boolean(p.umbrellaGap),
    notes: p.notes || "extracted",
  }));
  const updated = updateCompany(id, { policies: [...company.policies, ...normalized] });
  return NextResponse.json({
    ok: true,
    provider,
    company: updated,
    score: updated ? scoreCompany(updated) : null,
  });
}
