"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUsd, parseUsd } from "@/lib/money";

export default function SetupCompany({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);
  const [template, setTemplate] = useState("clinic");
  const [cash, setCash] = useState("");
  const [ebitda, setEbitda] = useState("");
  const [revenue, setRevenue] = useState("");
  const [preview, setPreview] = useState<number | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTemplate(d.template || "clinic");
        setCash(formatUsd(d.company.exposures.cash) || "");
        setEbitda(formatUsd(d.company.exposures.ebitda) || "");
        setRevenue(formatUsd(d.company.exposures.revenue) || "");
        setPreview(d.derivedSir);
      });
  }, [id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template,
        applyDerivedBar: true,
        exposures: {
          cash: parseUsd(cash),
          ebitda: parseUsd(ebitda),
          revenue: parseUsd(revenue),
        },
      }),
    });
    const json = await res.json();
    setPreview(json.company?.goals.maxSir ?? null);
    setSaved(
      `Bar set. Max SIR $${Number(json.company?.goals.maxSir ?? 0).toLocaleString()}. Tell the CFO to sign in at this site as “${id}”.`,
    );
  }

  if (!data?.company) return <p className="muted">Loading…</p>;

  return (
    <main>
      <p className="small">
        <Link href="/pm/setup">← All companies</Link>
      </p>
      <h2>{data.company.name}</h2>
      <p className="muted">
        CFO login username for the shared URL: {data.company.login?.username ?? id}
        {data.company.login?.password ? ` · password ${data.company.login.password}` : ""}
      </p>
      <form onSubmit={apply} className="card" style={{ marginTop: 18, maxWidth: 520 }}>
        <label>Industry template</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          {(data.templates || []).map((t: { id: string; label: string; blurb: string }) => (
            <option key={t.id} value={t.id}>
              {t.label} — {t.blurb}
            </option>
          ))}
        </select>
        <label>Cash ($)</label>
        <input value={cash} onChange={(e) => setCash(e.target.value)} />
        <label>EBITDA ($)</label>
        <input value={ebitda} onChange={(e) => setEbitda(e.target.value)} />
        <label>Revenue ($)</label>
        <input value={revenue} onChange={(e) => setRevenue(e.target.value)} />
        <p className="small" style={{ marginTop: 12 }}>
          Computed max SIR {preview != null ? `$${preview.toLocaleString()}` : "—"} (1% of cash, 5% of
          EBITDA, template ceiling). Limit floors come from the template.
        </p>
        <button className="btn pm" style={{ marginTop: 12 }} type="submit">
          Apply bar
        </button>
        {saved ? <p className="ok">{saved}</p> : null}
      </form>
    </main>
  );
}
