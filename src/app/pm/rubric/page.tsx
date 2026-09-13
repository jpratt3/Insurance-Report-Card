import { PILLARS, ARCHETYPE_LABEL, LINE_BANDS } from "@/lib/rubric";

function usd(n: number | undefined) {
  return `$${(n ?? 0).toLocaleString("en-US")}`;
}

export default function RubricPage() {
  return (
    <main className="paper">
      <div className="eyebrow">Step 1 · Rubric</div>
      <h2>How the 0–100 and letter are produced</h2>
      <p className="muted">
        Hybrid rules: fixed floors for GL/auto/WC; contract-max for umbrella / E&O
        / cyber / professional; quality checks on sublimits. LLM extracts facts
        only. One knockout caps the letter at D; two or more cap at F.
      </p>
      <h3>Pillars</h3>
      <table>
        <thead>
          <tr>
            <th>Pillar</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {PILLARS.map((p) => (
            <tr key={p.id}>
              <td>{p.label}</td>
              <td>{p.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Letters</h3>
      <p>A 90–100 · B 80–89 · C 70–79 · D 60–69 · F below 60.</p>
      <h3>Archetypes</h3>
      <p>{Object.values(ARCHETYPE_LABEL).join(" · ")}</p>
      <h3>Clinic v0 band (example)</h3>
      <p className="muted">
        GL {usd(LINE_BANDS.clinics.gl?.occurrence)} occ · umbrella{" "}
        {usd(LINE_BANDS.clinics.umbrella?.occurrence)} · professional {usd(1_000_000)} /{" "}
        {usd(3_000_000)} · cyber {usd(LINE_BANDS.clinics.cyber?.occurrence)}
      </p>
    </main>
  );
}
