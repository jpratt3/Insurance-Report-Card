"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  status: string;
  archetype: string;
  maxSir: number;
  readyToScore: boolean;
  rawTotal: number | null;
  letter: string | null;
  missingCount: number;
};

export default function PmPortfolio() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d) => setRows(d.companies ?? []))
      .catch(() => setRows([]));
  }, []);

  if (!rows) return <p className="muted">Loading…</p>;

  return (
    <main>
      {rows.length === 0 ? (
        <div className="card" style={{ marginTop: 28, maxWidth: 520 }}>
          <h2>No companies yet</h2>
          <p className="muted">
            Start with the reporting pack you already have. Policies come from
            the company later.
          </p>
          <Link href="/pm/setup/new" className="btn pm" style={{ marginTop: 12 }}>
            Add company
          </Link>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18, overflowX: "auto" }}>
          <p style={{ marginBottom: 12 }}>
            <Link href="/pm/setup/new" className="btn pm">
              Add company
            </Link>
          </p>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Template</th>
                <th>Max SIR</th>
                <th>Intake</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="clickable"
                  onClick={() => (window.location.href = `/pm/${r.id}`)}
                >
                  <td>{r.name}</td>
                  <td>{r.archetype}</td>
                  <td>${(r.maxSir ?? 0).toLocaleString()}</td>
                  <td>
                    {r.readyToScore ? "Policies on file" : `Awaiting CFO · ${r.missingCount} items`}
                  </td>
                  <td>
                    {r.letter ? (
                      <span className={`letter ${r.letter}`}>{r.letter}</span>
                    ) : (
                      <span className="small">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
