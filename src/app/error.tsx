"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="card" style={{ marginTop: 28, maxWidth: 520 }}>
      <h2>Could not load this page</h2>
      <p className="muted">{error.message || "Try again. If it repeats, restart the app from start.bat."}</p>
      <button className="btn pm" style={{ marginTop: 12 }} type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
