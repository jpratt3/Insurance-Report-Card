"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#050b14", color: "#f4f8fc", fontFamily: 'Georgia, "Palatino Linotype", Palatino, serif', padding: 40 }}>
        <h1 style={{ color: "#71b7e6" }}>Could not load the report card</h1>
        <p style={{ color: "rgba(244,248,252,0.68)" }}>{error.message || "Refresh, or close this window and run start.bat again."}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 12,
            padding: "10px 16px",
            border: 0,
            borderRadius: 999,
            background: "linear-gradient(90deg, #3aa0e8 0%, #8fd0f7 100%)",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
