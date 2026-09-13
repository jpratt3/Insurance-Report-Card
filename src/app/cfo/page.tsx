"use client";

import { DOCUMENT_LABEL, hasScheduleOfInsurance, intakeGroupsFor } from "@/lib/inputs";
import { LINE_LABEL } from "@/lib/rubric";
import { formatUsd, parseUsd } from "@/lib/money";
import type { Archetype, PolicyLine } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const ACCEPT = ".pdf,.xlsx,.xls,.csv,.png,.jpg";

type IntakeItem = {
  key: string;
  type: string;
  label: string;
  detail?: string;
  status: "missing" | "received" | "listed";
  files: { id: string; filename: string }[];
  policyId?: string;
};

export default function CfoPortal() {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busyType, setBusyType] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [scannedKeys, setScannedKeys] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  function load(cid: string) {
    fetch(`/api/companies/${cid}`)
      .then((r) => r.json())
      .then((d) => setData(d?.company ? d : { error: d?.error || "Could not load company" }))
      .catch(() => setData({ error: "Could not load company" }));
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const cid = d.session?.companyId;
        if (cid) {
          setId(cid);
          load(cid);
        }
      });
  }, []);

  useEffect(() => {
    if (data?.company?.exposures && draft === null) {
      setDraft({ ...data.company.exposures });
    }
  }, [data, draft]);

  async function saveExposures(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const exposures: Record<string, unknown> = {
      hasPhi: fd.get("hasPhi") === "on",
      hasCustomerData: fd.get("hasCustomerData") === "on",
    };
    for (const [k, v] of fd.entries()) {
      if (k === "hasPhi" || k === "hasCustomerData" || k === "notes") continue;
      if (v === "") continue;
      exposures[k] = parseUsd(v);
    }
    exposures.notes = String(fd.get("notes") || "");
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exposures }),
    });
    setDraft(exposures);
    setScannedKeys([]);
    setMsg("Saved. Missing items refreshed.");
    load(id);
  }

  async function scanExposures() {
    setScanning(true);
    setMsg("");
    try {
      const res = await fetch(`/api/companies/${id}/exposures/scan`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || "Scan failed");
        return;
      }
      const found = json.exposures || {};
      setDraft((prev) => ({ ...(prev ?? {}), ...found }));
      setScannedKeys(json.found ?? Object.keys(found));
      const n = (json.found ?? []).length;
      setMsg(
        n
          ? `Scan filled ${n} field${n === 1 ? "" : "s"} (${json.method}). Review the highlighted values, then save.`
          : "Scan ran, but no exposure fields could be read. Check the file or enter values by hand.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function uploadFiles(kind: string, files: FileList | File[], policyId?: string) {
    const list = Array.from(files).filter((f) => f.size);
    if (!list.length) return;
    setBusyType(policyId ? `policy:${policyId}` : kind);
    setMsg("");
    try {
      let soiMessage = "";
      for (const file of list) {
        const fd = new FormData();
        fd.set("kind", kind);
        fd.set("file", file);
        if (policyId) fd.set("policyId", policyId);
        const res = await fetch(`/api/companies/${id}/documents`, { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(json.error || "Upload failed");
          return;
        }
        if (json.soiMessage) soiMessage = json.soiMessage;
      }
      setMsg(soiMessage || "File received.");
      load(id);
    } finally {
      setBusyType("");
    }
  }

  async function removeFile(docId: string) {
    setMsg("");
    const res = await fetch(`/api/companies/${id}/documents/${docId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json.error || "Could not remove file");
      return;
    }
    setMsg("File removed.");
    load(id);
  }

  if (data?.error && !data?.company) return <p className="miss">{data.error}</p>;
  if (!data?.company) return <p className="muted">Loading your portal…</p>;
  const { company } = data;
  const docs = company.documents ?? [];
  const received = new Set((data.receivedDocuments ?? []).map((d: { type: string }) => d.type));
  const hasSoi = hasScheduleOfInsurance(docs);
  const soiPolicies = ((company.policies ?? []) as PolicyLine[]).filter((p) => p.source === "soi");
  const showBundle = !hasSoi || soiPolicies.length === 0;

  const groups = intakeGroupsFor(company.archetype as Archetype).map((group) => {
    let items: IntakeItem[] = group.types.map((type) => {
      const files = docs.filter((d: { type: string; policyId?: string }) => d.type === type && !d.policyId);
      return {
        key: type,
        type,
        label: DOCUMENT_LABEL[type],
        status: (received.has(type) || files.length > 0 ? "received" : "missing") as IntakeItem["status"],
        files,
      };
    });

    if (group.id === "policy") {
      const soi = items.filter((i) => i.type === "schedule_of_insurance");
      const rest = items.filter((i) => i.type !== "schedule_of_insurance");
      const extra: IntakeItem[] = [];
      if (showBundle) {
        const files = docs.filter(
          (d: { type: string; policyId?: string }) =>
            (d.type === "binder_or_dec" || d.type === "endorsement") && !d.policyId,
        );
        extra.push({
          key: "binder_or_dec",
          type: "binder_or_dec",
          label: "Policies / endorsements",
          status: files.length > 0 ? "received" : "missing",
          files,
        });
      } else {
        for (const policy of soiPolicies) {
          const files = docs.filter((d: { policyId?: string }) => d.policyId === policy.id);
          const limit = money(policy.limitOccurrence);
          extra.push({
            key: `policy:${policy.id}`,
            type: "binder_or_dec",
            policyId: policy.id,
            label: LINE_LABEL[policy.line] || policy.line,
            detail: [policy.carrier, limit].filter(Boolean).join(" · "),
            status: files.length > 0 ? "received" : "listed",
            files,
          });
        }
      }
      items = [...soi, ...extra, ...rest];
    }

    const got = items.filter((i) => i.status === "received").length;
    const missing = items.filter((i) => i.status === "missing").length;
    return { ...group, items, got, missing };
  });

  function isOpen(groupId: string, missingCount: number) {
    if (groupId in open) return open[groupId];
    if (groupId === "policy") return true;
    return missingCount > 0;
  }

  return (
    <main className="cfo-main">
      <p className="muted intake-lead">
        Drop a schedule of insurance to list the policies on it. If you do not
        have an SOI, use the general policies / endorsements slot.
      </p>
      {msg ? <p className={msg.toLowerCase().includes("fail") || msg.includes("could not") ? "miss" : "ok"}>{msg}</p> : null}
      <div className="card intake-card">
        {groups.map((group) => {
          const expanded = isOpen(group.id, group.missing);
          return (
            <section key={group.id} className="intake-group">
              <button
                type="button"
                className="intake-group-head"
                aria-expanded={expanded}
                onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !expanded }))}
              >
                <span className="intake-caret">{expanded ? "▾" : "▸"}</span>
                <span className="intake-group-title">{group.label}</span>
                <span className={`intake-count${group.missing ? " miss" : " ok"}`}>
                  {group.got}/{group.items.length}
                  {group.missing ? ` · ${group.missing} missing` : ""}
                </span>
              </button>
              {expanded ? (
                <ul className="intake-list">
                  {group.items.map((row) => (
                    <IntakeRow
                      key={row.key}
                      label={row.label}
                      detail={row.detail}
                      status={row.status}
                      files={row.files}
                      busy={busyType === row.key || busyType === row.type}
                      dropLabel={row.policyId ? "Binder" : undefined}
                      onFiles={(files) => uploadFiles(row.type, files, row.policyId)}
                      onRemove={(docId) => removeFile(docId)}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
      <div className="card intake-card" style={{ marginTop: 16 }}>
        <h2>Exposures and missing financials</h2>
        <p className="small">
          Drop ACORD / application / headcount / fleet files, then scan. Only
          fields the scan is confident about are filled. Review the green
          highlights and save.
        </p>
        <div className="exposure-scan">
          <div
            className={`exposure-drop${busyType === "exposure_pack" ? " over" : ""}`}
            onClick={() => document.getElementById("exposure-file")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles("exposure_pack", e.dataTransfer.files);
            }}
          >
            <input
              id="exposure-file"
              type="file"
              multiple
              accept={ACCEPT}
              className="drop-input"
              onChange={(e) => {
                if (e.target.files) uploadFiles("exposure_pack", e.target.files);
                e.target.value = "";
              }}
            />
            {busyType === "exposure_pack" ? "Uploading…" : "Drop exposure documents"}
          </div>
          <button className="btn" type="button" disabled={scanning} onClick={scanExposures}>
            {scanning ? "Scanning…" : "Scan uploads"}
          </button>
        </div>
        {docs.filter((d: { type: string }) => d.type === "exposure_pack").length ? (
          <ul className="intake-list" style={{ paddingLeft: 0, marginBottom: 12 }}>
            {docs
              .filter((d: { type: string }) => d.type === "exposure_pack")
              .map((file: { id: string; filename: string }) => (
                <li className="intake-file" key={file.id}>
                  <span>{file.filename}</span>
                  <button type="button" className="intake-remove" onClick={() => removeFile(file.id)}>
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
        <form onSubmit={saveExposures} className="grid grid-3">
          {data.exposureFields.map((f: { key: string; label: string; hint: string }) => (
            <div key={f.key} className={scannedKeys.includes(f.key) ? "field-scanned" : ""}>
              <label>
                {f.label}
                <span className="small"> — {f.hint}</span>
              </label>
              <input
                name={f.key}
                value={moneyField(f.label, draft?.[f.key] ?? company.exposures[f.key])}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...(prev ?? company.exposures),
                    [f.key]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
          <label className={scannedKeys.includes("hasPhi") ? "field-scanned" : ""}>
            <input
              type="checkbox"
              name="hasPhi"
              checked={Boolean(draft?.hasPhi ?? company.exposures.hasPhi)}
              onChange={(e) =>
                setDraft((prev) => ({ ...(prev ?? company.exposures), hasPhi: e.target.checked }))
              }
            />{" "}
            holds PHI
          </label>
          <label className={scannedKeys.includes("hasCustomerData") ? "field-scanned" : ""}>
            <input
              type="checkbox"
              name="hasCustomerData"
              checked={Boolean(draft?.hasCustomerData ?? company.exposures.hasCustomerData)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...(prev ?? company.exposures),
                  hasCustomerData: e.target.checked,
                }))
              }
            />{" "}
            holds customer data
          </label>
          <div className={scannedKeys.includes("notes") ? "field-scanned" : ""}>
            <label>Notes</label>
            <input
              name="notes"
              value={String(draft?.notes ?? company.exposures.notes ?? "")}
              onChange={(e) =>
                setDraft((prev) => ({ ...(prev ?? company.exposures), notes: e.target.value }))
              }
            />
          </div>
          <div>
            <button className="btn" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function IntakeRow({
  label,
  detail,
  status,
  files,
  busy,
  dropLabel,
  onFiles,
  onRemove,
}: {
  label: string;
  detail?: string;
  status: "missing" | "received" | "listed";
  files: { id: string; filename: string }[];
  busy: boolean;
  dropLabel?: string;
  onFiles: (files: FileList | File[]) => void;
  onRemove: (docId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <li className={`intake-row ${status}`}>
      <span className={`intake-mark${status === "received" ? " on" : ""}`} aria-hidden>
        {status === "received" ? "✓" : status === "listed" ? "·" : ""}
      </span>
      <div className="intake-copy">
        <p className="intake-name">{label}</p>
        {detail ? <p className="intake-file"><span>{detail}</span></p> : null}
        {files.map((file) => (
          <p className="intake-file" key={file.id}>
            <span>{file.filename}</span>
            <button
              type="button"
              className="intake-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file.id);
              }}
            >
              Remove
            </button>
          </p>
        ))}
      </div>
      <div
        className={`intake-drop${over ? " over" : ""}${status === "received" ? " done" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="drop-input"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {busy ? "…" : dropLabel || (status === "received" ? "Add" : "Drop")}
      </div>
    </li>
  );
}

function money(n: number) {
  return formatUsd(n);
}

function moneyField(label: string, value: unknown) {
  if (value == null || value === "") return "";
  if (label.includes("($)") && typeof value === "number") return formatUsd(value) || (value === 0 ? "" : String(value));
  return String(value);
}
