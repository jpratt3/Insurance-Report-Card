"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = { id: string; name: string; archetype: string; maxSir: number; readyToScore: boolean };

export default function SetupIndex() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d) => setRows(d.companies ?? []));
  }, []);
  return (
    <main>
      <div className="eyebrow">Setup / invite</div>
      <h2>Companies in the book</h2>
          <p className="muted">
            <Link href="/pm/setup/new" className="text-link">Add a company</Link> with financials first.
        After that, the CFO signs in on this same site with the company
        username (the id).
      </p>
      <div className="card" style={{ marginTop: 18 }}>
        {rows.length === 0 ? (
          <p className="muted">Nothing here yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>CFO username</th>
                <th>Max SIR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <code>{r.id}</code>
                  </td>
                  <td>${(r.maxSir ?? 0).toLocaleString()}</td>
                  <td>
                    <Link href={`/pm/setup/${r.id}`}>Edit bar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
