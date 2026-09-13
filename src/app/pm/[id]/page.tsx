"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isPmFinancial } from "@/lib/inputs";
import { formatUsd, parseUsd } from "@/lib/money";

const GOAL_FIELDS = [
  "minUmbrella",
  "minCyber",
  "minDo",
  "minProfessional",
  "minTechEo",
  "maxSir",
] as const;

type GoalDraft = Record<string, string>;

function goalDraft(goals: Record<string, unknown>): GoalDraft {
  const draft: GoalDraft = {};
  for (const k of GOAL_FIELDS) draft[k] = formatUsd(Number(goals[k] ?? 0)) || "";
  draft.minAmBest = String(goals.minAmBest ?? "");
  return draft;
}

export default function PmCompany({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [asking, setAsking] = useState(false);
  const [goals, setGoals] = useState<GoalDraft>({});
  const [undoGoals, setUndoGoals] = useState<GoalDraft | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  function load(cid: string) {
    fetch(`/api/companies/${cid}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d?.company ? d : { error: d?.error || "Could not load company" });
        if (d?.company) {
          setGoals(goalDraft(d.company.goals));
          setUndoGoals(null);
        }
      })
      .catch(() => setData({ error: "Could not load company" }));
  }

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  if (data?.error && !data?.company) return <p className="miss">{data.error}</p>;
  if (!data?.company) return <p className="muted">Loading…</p>;
  const { company, score, archetypeLabel, readyToScore } = data;
  const financials = (company.documents ?? []).filter((d: { type: string }) => isPmFinancial(d.type));

  async function saveGoals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goals: {
          minUmbrella: parseUsd(goals.minUmbrella),
          minCyber: parseUsd(goals.minCyber),
          minDo: parseUsd(goals.minDo),
          minProfessional: parseUsd(goals.minProfessional),
          minTechEo: parseUsd(goals.minTechEo),
          minAmBest: goals.minAmBest || "A-",
          maxSir: parseUsd(goals.maxSir),
        },
      }),
    });
    load(id);
  }

  /** Ask Claude how the bar should move, then stage its numbers in the form. */
  async function ask() {
    if (!question.trim() || asking) return;
    setAsking(true);
    setMsg("");
    setAnswer("");
    try {
      const res = await fetch(`/api/companies/${id}/advise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || `Ask failed (${res.status})`);
        return;
      }
      setAnswer(json.answer || "");
      const proposed = json.goals ?? {};
      const changed: string[] = [];
      const next = { ...goals };
      for (const k of GOAL_FIELDS) {
        const v = proposed[k];
        if (typeof v !== "number" || !Number.isFinite(v)) continue;
        const formatted = formatUsd(v) || "";
        if (formatted !== next[k]) {
          next[k] = formatted;
          changed.push(k);
        }
      }
      if (typeof proposed.minAmBest === "string" && proposed.minAmBest && proposed.minAmBest !== next.minAmBest) {
        next.minAmBest = proposed.minAmBest;
        changed.push("minAmBest");
      }
      if (changed.length) {
        setUndoGoals(goals);
        setGoals(next);
        setMsg(`Staged ${changed.join(", ")} below. Save bar to keep, or undo.`);
      } else {
        setMsg("No goal changes proposed.");
      }
    } catch {
      setMsg("Ask failed. Try again.");
    } finally {
      setAsking(false);
    }
  }

  function undo() {
    if (!undoGoals) return;
    setGoals(undoGoals);
    setUndoGoals(null);
    setMsg("Reverted to the numbers before the ask.");
  }

  return (
    <main>
      <p className="small">
        <Link href="/pm">← Book</Link> · {archetypeLabel} · {company.status} ·{" "}
        <Link href={`/pm/setup/${id}`}>Edit bar / invite</Link>
      </p>
      <div className="split" style={{ marginTop: 16 }}>
        <div className="paper">
          <div className="eyebrow">PM one-pager</div>
          <h2>{company.name}</h2>
          <p className="muted">
            {company.sector}
            {company.hq ? ` · HQ ${company.hq}` : ""}
            {company.partnered ? ` · Opened ${company.partnered}` : ""}
          </p>
          <p className="small">
            CFO username: <code>{company.login?.username ?? id}</code>
            {company.login?.password ? (
              <>
                {" "}
                · password <code>{company.login.password}</code>
              </>
            ) : null}{" "}
            · Max SIR ${Number(company.goals.maxSir || 0).toLocaleString()}
          </p>
          {readyToScore && score ? (
            <>
              <div style={{ display: "flex", gap: 24, alignItems: "center", margin: "16px 0" }}>
                <span className={`letter ${score.letter}`} style={{ width: 56, height: 56, fontSize: 28 }}>
                  {score.letter}
                </span>
                <div>
                  <div className="stat">{score.rawTotal}</div>
                  <div className="small">
                    Raw letter {score.letterFromMath}
                    {score.knockoutCount ? ` · capped (${score.knockoutCount} knockout)` : ""}
                  </div>
                  {score.dataConfidence ? (
                    <div className="small">
                      {score.dataConfidence.documentsReceived}/
                      {score.dataConfidence.documentsRequired} documents on file
                      {score.dataConfidence.provisional ? " · provisional" : ""}
                    </div>
                  ) : null}
                </div>
              </div>
              {score.dataConfidence?.provisional ? (
                <div className="flag knockout">
                  Provisional grade — scored on incomplete evidence:{" "}
                  {score.dataConfidence.unverifiedInputs.join(", ").toLowerCase()}. Withheld inputs
                  score as unverified, never as clean.
                </div>
              ) : null}
              {score.knockouts
                .filter((k: { triggered: boolean }) => k.triggered)
                .map((f: { id: string; label: string }) => (
                  <div className="flag knockout" key={f.id}>
                    {f.label}
                  </div>
                ))}
              {score.pillars.map((p: { id: string; label: string; points: number; max: number }) => (
                <div key={p.id} style={{ margin: "12px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{p.label}</strong>
                    <span>
                      {p.points}/{p.max}
                    </span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${(p.points / p.max) * 100}%` }} />
                  </div>
                </div>
              ))}
              <h3>Broker talking points</h3>
              <ul>
                {score.talkingPoints.map((t: string) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="card" style={{ margin: "16px 0" }}>
              <h3>Awaiting CFO intake</h3>
              <p className="muted">
                Financials are on the desk. No letter until policies are on file. Send the CFO this
                same URL and username <code>{company.login?.username ?? id}</code>.
              </p>
              <p className="small" style={{ marginTop: 12 }}>
                Still missing
              </p>
              <ul className="check">
                {(score.missingDocuments ?? []).map((m: { type: string; label: string }) => (
                  <li className="miss" key={m.type}>
                    {m.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h3>Financials on file</h3>
          {financials.length === 0 ? (
            <p className="muted">None yet.</p>
          ) : (
            <ul className="check">
              {financials.map((d: { id: string; filename: string }) => (
                <li className="ok" key={d.id}>
                  {d.filename}
                </li>
              ))}
            </ul>
          )}
          <h3>Program</h3>
          {company.policies.length === 0 ? (
            <p className="muted">No policies yet. The CFO uploads binders from their portal.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Limit</th>
                  <th>SIR</th>
                  <th>Carrier</th>
                </tr>
              </thead>
              <tbody>
                {company.policies.map((p: { id: string; line: string; limitOccurrence: number; retention: number; carrier: string; amBest: string }) => (
                  <tr key={p.id}>
                    <td>{p.line}</td>
                    <td>{money(p.limitOccurrence)}</td>
                    <td>{money(p.retention)}</td>
                    <td>
                      {p.carrier} {p.amBest}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <div className="card">
            <h2>Company goals</h2>
            <p className="small">PM-owned. Applied when policies exist.</p>
            <form onSubmit={saveGoals}>
              {GOAL_FIELDS.map((k) => (
                <div key={k} className={undoGoals && undoGoals[k] !== goals[k] ? "field-scanned" : ""}>
                  <label>{k}</label>
                  <input
                    name={k}
                    value={goals[k] ?? ""}
                    onChange={(e) => setGoals((prev) => ({ ...prev, [k]: e.target.value }))}
                  />
                </div>
              ))}
              <div className={undoGoals && undoGoals.minAmBest !== goals.minAmBest ? "field-scanned" : ""}>
                <label>minAmBest</label>
                <input
                  name="minAmBest"
                  value={goals.minAmBest ?? ""}
                  onChange={(e) => setGoals((prev) => ({ ...prev, minAmBest: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn pm" type="submit">
                  Save bar
                </button>
                {undoGoals ? (
                  <button className="btn secondary" type="button" onClick={undo}>
                    Undo
                  </button>
                ) : null}
              </div>
            </form>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Ask me a question</h2>
            <p className="small">
              Reads this company&rsquo;s financials and the house rubric. Answers stage new numbers in
              the bar above — nothing saves until you hit Save bar.
            </p>
            <div className="ask-row">
              <textarea
                rows={3}
                value={question}
                placeholder="Based on my financials, how should my company goals change?"
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
              />
              <button
                className="ask-send"
                type="button"
                onClick={ask}
                disabled={asking || !question.trim()}
                aria-label="Ask"
                title="Ask (Enter)"
              >
                {asking ? (
                  <span className="ask-spin" aria-hidden="true" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h13M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            {answer ? <p className="ask-answer">{answer}</p> : null}
            {msg ? <p className="small">{msg}</p> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function money(n: number | null) {
  if (n == null) return "—";
  return formatUsd(n, "—");
}
