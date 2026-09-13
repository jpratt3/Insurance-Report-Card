"use client";

import { PM_SETUP_DOCUMENTS, slugify } from "@/lib/inputs";
import { formatUsd } from "@/lib/money";
import type { DocumentType } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const ACCEPT = ".pdf,.xlsx,.xls,.csv,.png,.jpg";

type SlotFiles = Partial<Record<DocumentType, File[]>>;

/** Readable one-off password the PM can dictate over the phone. */
function newPassword(): string {
  const words = ["harbor", "quartz", "meridian", "lantern", "cobalt", "juniper", "summit", "vellum"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(Math.random() * 9000) + 1000);
  return `${pick()}-${pick()}-${digits}`;
}

type MoneyField = "cash" | "ebitda" | "revenue";

const MONEY_FIELDS: { field: MoneyField; label: string; placeholder: string }[] = [
  { field: "cash", label: "Cash ($)", placeholder: "$3,000,000" },
  { field: "ebitda", label: "EBITDA ($)", placeholder: "$4,500,000" },
  { field: "revenue", label: "Revenue ($)", placeholder: "$38,000,000" },
];

export default function NewCompany() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<SlotFiles>({});
  const [money, setMoney] = useState<Record<MoneyField, string>>({
    cash: "",
    ebitda: "",
    revenue: "",
  });
  const [sources, setSources] = useState<Partial<Record<MoneyField, string>>>({});
  const [reading, setReading] = useState(false);
  const edited = useRef<Set<MoneyField>>(new Set());
  const [cfoUsername, setCfoUsername] = useState("");
  const [cfoPassword, setCfoPassword] = useState(() => newPassword());
  const usernameEdited = useRef(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const requiredOk = PM_SETUP_DOCUMENTS.filter((d) => d.required).some(
      (d) => (slots[d.type] ?? []).length > 0,
    );
    if (!requiredOk) {
      setError("Drop the P&L or balance sheet (a combined audit can go in either required slot).");
      return;
    }
    const fd = new FormData(e.currentTarget);
    if (!cfoUsername.trim() || cfoPassword.trim().length < 6) {
      setError("Set a CFO username and a password of at least 6 characters.");
      return;
    }
    if (!money.cash && !money.ebitda && !money.revenue) {
      setError(
        "No cash, EBITDA, or revenue read from the uploads. Enter at least one from the statements, then save.",
      );
      return;
    }
    setBusy(true);
    setError("");
    for (const [type, files] of Object.entries(slots)) {
      for (const file of files ?? []) fd.append(type, file);
    }
    try {
      const res = await fetch("/api/companies", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || `Could not create company (${res.status})`);
        return;
      }
      if (!json.company?.id) {
        setError("Saved, but the desk did not return a company id.");
        return;
      }
      router.push(`/pm/${json.company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function setSlot(type: DocumentType, files: File[]) {
    const next = { ...slots, [type]: files };
    setSlots(next);
    void autofill(next);
  }

  /** Read the dropped statements and fill any figure the PM has not typed over. */
  async function autofill(next: SlotFiles) {
    const fd = new FormData();
    let count = 0;
    for (const [type, files] of Object.entries(next)) {
      for (const file of files ?? []) {
        fd.append(type, file);
        count += 1;
      }
    }
    if (!count) {
      setSources({});
      return;
    }
    setReading(true);
    try {
      const res = await fetch("/api/financials/extract", { method: "POST", body: fd });
      if (!res.ok) return;
      const json = (await res.json()) as {
        cash: number | null;
        ebitda: number | null;
        revenue: number | null;
        sources: Partial<Record<MoneyField, string | null>>;
      };
      const found: Partial<Record<MoneyField, string>> = {};
      setMoney((prev) => {
        const updated = { ...prev };
        for (const { field } of MONEY_FIELDS) {
          const value = json[field];
          if (edited.current.has(field) || !value) continue;
          updated[field] = formatUsd(value);
          const src = json.sources?.[field];
          if (src) found[field] = src;
        }
        return updated;
      });
      setSources(found);
      setError("");
    } catch {
      // Autofill is a convenience; the PM can still type the figures.
    } finally {
      setReading(false);
    }
  }

  return (
    <main>
      <p className="small">
        <Link href="/pm">← Book</Link>
      </p>
      <h2>Upload financials</h2>
      <p className="muted" style={{ maxWidth: 640 }}>
        PM setup is financials only. Policies come from the company later. Pick a
        template and drop the statements you already have — cash, EBITDA, and
        revenue read off the uploads. A combined audit can go in either required
        slot.
      </p>
      <form onSubmit={submit} className="card" style={{ marginTop: 20, maxWidth: 760 }}>
        <label>Company name</label>
        <input
          name="name"
          required
          placeholder="Legal name"
          onChange={(e) => {
            if (!usernameEdited.current) setCfoUsername(slugify(e.target.value));
          }}
        />
        <label>Industry template</label>
        <select name="template" defaultValue="clinic">
          <option value="clinic">Clinic — outpatient / professional / PHI</option>
          <option value="field">Field + software — techs on site, auto, umbrella</option>
          <option value="saas">SaaS / AI — E&O and cyber</option>
        </select>
        <div className="dropzones">
          {PM_SETUP_DOCUMENTS.map((doc) => (
            <DropField
              key={doc.type}
              label={doc.label}
              hint={doc.hint}
              required={doc.required}
              files={slots[doc.type] ?? []}
              onFiles={(files) => setSlot(doc.type, files)}
            />
          ))}
        </div>
        <p className="small" style={{ marginTop: 4 }}>
          {reading
            ? "Reading the statements…"
            : "Cash, EBITDA, and revenue fill in from the uploads. Type over anything that looks wrong."}
        </p>
        {MONEY_FIELDS.map(({ field, label, placeholder }) => (
          <div key={field}>
            <label htmlFor={field}>{label}</label>
            <input
              id={field}
              name={field}
              inputMode="numeric"
              placeholder={placeholder}
              value={money[field]}
              onChange={(e) => {
                edited.current.add(field);
                setMoney((prev) => ({ ...prev, [field]: e.target.value }));
              }}
            />
            {sources[field] ? <p className="small">From {sources[field]}</p> : null}
          </div>
        ))}
        <div className="subcard">
          <h3>CFO login</h3>
          <p className="small">
            What the company signs in with. Prefilled from the name — change either one, then send
            the CFO this URL and these credentials.
          </p>
          <label htmlFor="cfoUsername">Username</label>
          <input
            id="cfoUsername"
            name="cfoUsername"
            autoComplete="off"
            spellCheck={false}
            value={cfoUsername}
            placeholder="acme-clinics"
            onChange={(e) => {
              usernameEdited.current = true;
              setCfoUsername(e.target.value.trim());
            }}
          />
          <label htmlFor="cfoPassword">Password</label>
          <div className="cred-row">
            <input
              id="cfoPassword"
              name="cfoPassword"
              autoComplete="off"
              spellCheck={false}
              value={cfoPassword}
              onChange={(e) => setCfoPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCfoPassword(newPassword())}
            >
              New
            </button>
          </div>
        </div>
        <button className="btn pm" style={{ marginTop: 16 }} disabled={busy} type="submit">
          {busy ? "Saving…" : "Create company and open desk"}
        </button>
        {error ? <p className="miss">{error}</p> : null}
      </form>
    </main>
  );
}

function DropField({
  label,
  hint,
  required,
  files,
  onFiles,
}: {
  label: string;
  hint: string;
  required: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function add(list: FileList | File[]) {
    const next = [...files];
    for (const file of Array.from(list)) {
      if (file.size && !next.some((f) => f.name === file.name && f.size === file.size)) {
        next.push(file);
      }
    }
    onFiles(next);
  }

  return (
    <div className="drop-field">
      <div className="drop-field-label">
        {label}
        {required ? <span className="req"> Required</span> : <span className="opt"> Optional</span>}
      </div>
      {hint ? <p className="small">{hint}</p> : null}
      <div
        className={`drop-target${over ? " over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="drop-input"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
        {files.length === 0 ? (
          <p>Drop files here or click to browse</p>
        ) : (
          <ul className="drop-files">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>
                {file.name}
                <button
                  type="button"
                  className="text-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFiles(files.filter((f) => f !== file));
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
