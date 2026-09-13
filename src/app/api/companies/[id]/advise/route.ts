import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { LINE_BANDS, PREMIUM_BENCHMARK } from "@/lib/benchmarks";
import { getCompany } from "@/lib/db";
import { ARCHETYPE_LABEL, defaultGoalsFor, deriveMaxSir, LINE_LABEL } from "@/lib/rubric";

export const dynamic = "force-dynamic";

/** Null on a goal means "leave the PM's current number alone". */
const AdviceSchema = z.object({
  answer: z
    .string()
    .describe("Two to five sentences answering the PM, in plain desk language. No preamble."),
  goals: z.object({
    minUmbrella: z.number().nullable(),
    minCyber: z.number().nullable(),
    minDo: z.number().nullable(),
    minProfessional: z.number().nullable(),
    minTechEo: z.number().nullable(),
    maxSir: z.number().nullable(),
    minAmBest: z.string().nullable(),
  }),
});

const SYSTEM = `You advise a portfolio manager who sets the insurance bar for portfolio companies.
You are given one company's financials, the bar the PM has set today, the house rubric, and any policies on file.

Answer the PM's question directly. Then propose the goal numbers you would set.

Rules:
- Whole USD, no strings, for every limit and the SIR. minAmBest is an AM Best rating like "A-" or "A".
- Return null for any goal you would leave exactly as it is. Never restate a number just to fill the field.
- The house max-SIR formula is min(1% cash, 5% EBITDA, industry ceiling). Follow it unless you say why not.
- Lines the company does not run (tech E&O for a pure field services shop) stay null, not zero.
- Ground the numbers in the financials and the archetype bands you were given, not in generic market advice.
- If the question is not about the bar, answer it and return all-null goals.`;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "pm") return NextResponse.json({ error: "PM only" }, { status: 403 });

  const { id } = await ctx.params;
  const company = getCompany(id);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { question } = (await req.json().catch(() => ({}))) as { question?: string };
  if (!question?.trim()) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY on the server. Add it to .env.local and restart." },
      { status: 503 },
    );
  }

  const e = company.exposures;
  const context = {
    company: {
      name: company.name,
      sector: company.sector,
      archetype: `${company.archetype} (${ARCHETYPE_LABEL[company.archetype]})`,
    },
    financials: {
      revenue: e.revenue,
      ebitda: e.ebitda,
      cash: e.cash,
      payroll: e.payroll,
      employees: e.employees,
      locations: e.locations,
      vehicles: e.vehicles,
      totalInsuredValue: e.tiv,
      yearsInBusiness: e.yearsInBusiness,
      wcEmr: e.emr,
      handlesPhi: e.hasPhi,
      handlesCustomerData: e.hasCustomerData,
      largestWire: e.largestWire,
      contractualMinimums: {
        umbrella: e.contractMinUmbrella,
        cyber: e.contractMinCyber,
        eo: e.contractMinEo,
      },
    },
    currentGoals: company.goals,
    houseRubric: {
      maxSirFormula: "min(1% cash, 5% EBITDA, industry ceiling)",
      maxSirThisFormulaWouldGive: deriveMaxSir(company.archetype, e.cash, e.ebitda),
      archetypeDefaultGoals: defaultGoalsFor(company.archetype),
      archetypeLimitBands: LINE_BANDS[company.archetype],
      premiumAsPercentOfRevenue: PREMIUM_BENCHMARK[company.archetype],
    },
    policiesOnFile: company.policies.map((p) => ({
      line: LINE_LABEL[p.line],
      limitOccurrence: p.limitOccurrence,
      retention: p.retention,
      carrier: p.carrier,
      amBest: p.amBest,
    })),
  };

  try {
    const client = new Anthropic();
    const res = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { format: zodOutputFormat(AdviceSchema), effort: "low" },
      messages: [
        {
          role: "user",
          content: `${JSON.stringify(context, null, 1)}\n\nPM asks: ${question.trim()}`,
        },
      ],
    });

    if (res.stop_reason === "refusal") {
      return NextResponse.json({ error: "The model declined to answer that one." }, { status: 502 });
    }
    const parsed = res.parsed_output;
    if (!parsed) {
      return NextResponse.json({ error: "Could not read the model's answer." }, { status: 502 });
    }
    return NextResponse.json({ answer: parsed.answer, goals: parsed.goals });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY was rejected." }, { status: 502 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited. Try again in a moment." }, { status: 502 });
    }
    console.error("advise failed", err);
    const message = err instanceof Anthropic.APIError ? err.message : "Ask failed. Try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
